import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const DEFAULT_API_URL = 'https://am4eey3lmk.execute-api.ap-south-1.amazonaws.com/api';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : DEFAULT_API_URL);

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Instantly wipe all auth tokens/data and redirect to /login
 */
export const handleUnauthorizedRedirect = () => {
  localStorage.removeItem('pgease_tenant_token');
  localStorage.removeItem('pgease_tenant_refresh_token');
  localStorage.removeItem('pgease_tenant_data');
  sessionStorage.removeItem('pgease_guest_mode');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pgease:unauthorized'));
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }
};

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('pgease_tenant_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 with token refresh, or force redirect to /login
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Do not intercept login or OTP verification errors as session expirations
    const isAuthRoute =
      originalRequest?.url?.includes('/tenants/otp/verify') ||
      originalRequest?.url?.includes('/tenants/otp/request');

    if (error.response?.status === 401 && !isAuthRoute) {
      const refreshToken = localStorage.getItem('pgease_tenant_refresh_token');

      // If no refresh token, already retried, or refresh token endpoint itself returned 401
      if (!refreshToken || originalRequest?._retry || originalRequest?.url?.includes('/tenants/refresh-token')) {
        handleUnauthorizedRedirect();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest?.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest!);
          })
          .catch((err) => {
            handleUnauthorizedRedirect();
            return Promise.reject(err);
          });
      }

      if (originalRequest) {
        originalRequest._retry = true;
      }
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/tenants/refresh-token`, {
          refreshToken,
        });

        const newAccessToken = data.accessToken;
        localStorage.setItem('pgease_tenant_token', newAccessToken);

        if (data.refreshToken) {
          localStorage.setItem('pgease_tenant_refresh_token', data.refreshToken);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        if (originalRequest?.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest!);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        handleUnauthorizedRedirect();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
