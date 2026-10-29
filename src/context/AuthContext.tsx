import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService, type TenancyDetailsResponse } from '../services/authService';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  tenant: any | null;
  isAuthenticated: boolean;
  isLinkedTenant: boolean;
  propertyDetails: TenancyDetailsResponse | null;
  isLoading: boolean;
  isCheckingTenancy: boolean;
  login: (accessToken: string, refreshToken: string, tenant: any) => Promise<void>;
  logout: () => void;
  checkTenancy: () => Promise<boolean>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const TOKEN_KEY = 'pgease_tenant_token';
const REFRESH_TOKEN_KEY = 'pgease_tenant_refresh_token';
const TENANT_DATA_KEY = 'pgease_tenant_data';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem(REFRESH_TOKEN_KEY));
  const [tenant, setTenant] = useState<any | null>(() => {
    const raw = localStorage.getItem(TENANT_DATA_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [isLinkedTenant, setIsLinkedTenant] = useState<boolean>(false);
  const [propertyDetails, setPropertyDetails] = useState<TenancyDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCheckingTenancy, setIsCheckingTenancy] = useState<boolean>(false);

  // Check whether the authenticated tenant is currently linked to an active PG
  const checkTenancy = useCallback(async (): Promise<boolean> => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      setIsLinkedTenant(false);
      setPropertyDetails(null);
      return false;
    }

    setIsCheckingTenancy(true);
    try {
      const data = await authService.getTenancyDetails();
      const isLinked = Boolean(data && data.isAddedToProperty);
      setIsLinkedTenant(isLinked);
      setPropertyDetails(data);
      return isLinked;
    } catch (err) {
      console.error('Failed to resolve tenancy details:', err);
      // On failure or 401, keep unlinked or default
      setIsLinkedTenant(false);
      setPropertyDetails(null);
      return false;
    } finally {
      setIsCheckingTenancy(false);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        await checkTenancy();
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for tab focus/visibility change to re-check if owner just added them
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && localStorage.getItem(TOKEN_KEY)) {
        checkTenancy();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [token, checkTenancy]);

  const login = async (accessToken: string, newRefreshToken: string, tenantData: any) => {
    setToken(accessToken);
    setRefreshToken(newRefreshToken);
    setTenant(tenantData);
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    localStorage.setItem(TENANT_DATA_KEY, JSON.stringify(tenantData));

    // Immediately resolve active stay link
    await checkTenancy();
  };

  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    setTenant(null);
    setIsLinkedTenant(false);
    setPropertyDetails(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TENANT_DATA_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshToken,
        tenant,
        isAuthenticated: !!token,
        isLinkedTenant,
        propertyDetails,
        isLoading,
        isCheckingTenancy,
        login,
        logout,
        checkTenancy,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
