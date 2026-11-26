import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const DEFAULT_API_URL = 'https://am4eey3lmk.execute-api.ap-south-1.amazonaws.com/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : DEFAULT_API_URL);

const TOKEN_KEY = 'pgease_tenant_token';
const REFRESH_KEY = 'pgease_tenant_refresh_token';
const TENANT_DATA_KEY = 'pgease_tenant_data';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getNativePrefs(): {
  get: (opts: { key: string }) => Promise<{ value: string | null }>;
  set: (opts: { key: string; value: string }) => Promise<void>;
  remove: (opts: { key: string }) => Promise<void>;
} | null {
  if (typeof window === 'undefined') return null;
  return (window as any).Capacitor?.Plugins?.Preferences ?? null;
}

export function saveTenantTokens(accessToken: string, refreshToken?: string | null) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
  const prefs = getNativePrefs();
  if (prefs) {
    void prefs.set({ key: TOKEN_KEY, value: accessToken });
    if (refreshToken) void prefs.set({ key: REFRESH_KEY, value: refreshToken });
  }
}

export async function hydrateTenantAuthFromNative(): Promise<void> {
  const prefs = getNativePrefs();
  if (!prefs || typeof window === 'undefined') return;
  for (const key of [TOKEN_KEY, REFRESH_KEY, TENANT_DATA_KEY]) {
    if (!localStorage.getItem(key)) {
      const res = await prefs.get({ key }).catch(() => ({ value: null }));
      if (res?.value) localStorage.setItem(key, res.value);
    }
  }
}

function isTokenExpiringSoon(token: string, thresholdSeconds = 120): boolean {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return false;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(payload + '==='.slice((payload.length + 3) % 4)));
    if (typeof json.exp !== 'number') return false;
    return Date.now() >= json.exp * 1000 - thresholdSeconds * 1000;
  } catch {
    return false;
  }
}

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
 * Wipe auth tokens/data and redirect to /login ONLY when session is truly ended/revoked or on manual logout.
 */
export const handleUnauthorizedRedirect = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(TENANT_DATA_KEY);
  sessionStorage.removeItem('pgease_guest_mode');

  const prefs = getNativePrefs();
  if (prefs) {
    void prefs.remove({ key: TOKEN_KEY });
    void prefs.remove({ key: REFRESH_KEY });
    void prefs.remove({ key: TENANT_DATA_KEY });
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pgease:unauthorized'));
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }
};

async function performSingleFlightRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;

  const { data } = await axios.post(`${BASE_URL}/tenants/refresh-token`, {
    refreshToken,
  });

  const newAccessToken = data.accessToken;
  saveTenantTokens(newAccessToken, data.refreshToken);
  apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
  return newAccessToken;
}

let _tenantLifecycleInit = false;
export function initTenantAuthLifecycle() {
  if (_tenantLifecycleInit || typeof window === 'undefined') return;
  _tenantLifecycleInit = true;

  const proactive = () => {
    if (!navigator.onLine) return;
    const token = localStorage.getItem(TOKEN_KEY);
    const rt = localStorage.getItem(REFRESH_KEY);
    if (!rt) return;
    if ((!token || isTokenExpiringSoon(token, 120)) && !isRefreshing) {
      isRefreshing = true;
      void performSingleFlightRefresh()
        .catch(() => {})
        .finally(() => {
          isRefreshing = false;
        });
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') proactive();
  });

  const capApp = (window as any).Capacitor?.Plugins?.App;
  if (capApp?.addListener) {
    capApp.addListener('appStateChange', (state: { isActive: boolean }) => {
      if (state.isActive) proactive();
    });
  }
}

// Request interceptor to attach JWT token (skip for public search & details)
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const url = config.url || '';
    const isPublic = url.includes('/public/') || url.startsWith('/properties/public');
    let token = localStorage.getItem(TOKEN_KEY);

    if (token && !isPublic && navigator.onLine && isTokenExpiringSoon(token, 120) && !isRefreshing && !url.includes('/refresh-token')) {
      isRefreshing = true;
      try {
        const refreshed = await performSingleFlightRefresh();
        if (refreshed) token = refreshed;
      } catch {
        // Do not fail request if proactive refresh had a transient network error
      } finally {
        isRefreshing = false;
      }
    }

    if (token && config.headers && !isPublic) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: refresh on 401; NEVER log out on network errors / offline / 5xx
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const isAuthRoute =
      originalRequest?.url?.includes('/tenants/otp/verify') ||
      originalRequest?.url?.includes('/tenants/otp/request');

    const isPublicRoute =
      originalRequest?.url?.includes('/properties/public') ||
      originalRequest?.url?.includes('/public/');

    if (error.response?.status === 401 && !isAuthRoute && !isPublicRoute) {
      const refreshToken = localStorage.getItem(REFRESH_KEY);

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
          .catch((err) => Promise.reject(err));
      }

      if (originalRequest) {
        originalRequest._retry = true;
      }
      isRefreshing = true;

      try {
        const newAccessToken = await performSingleFlightRefresh();
        if (!newAccessToken) {
          handleUnauthorizedRedirect();
          return Promise.reject(error);
        }
        processQueue(null, newAccessToken);
        if (originalRequest?.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest!);
      } catch (refreshErr: any) {
        processQueue(refreshErr, null);
        const status = refreshErr?.response?.status;
        // ONLY log out if server explicitly rejected the refresh token (401/403)
        if (status === 401 || status === 403) {
          handleUnauthorizedRedirect();
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
