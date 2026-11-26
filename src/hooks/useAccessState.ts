import { useAuth } from '../context/AuthContext';
import type { TenantAccessGating } from '../mobile/navRegistry';

export type AccessState = 'guest' | 'noPg' | 'activeStay';

export function useAccessState() {
  const { isAuthenticated, isLinkedTenant, isLoading } = useAuth();

  const accessState: AccessState = !isAuthenticated
    ? 'guest'
    : isLinkedTenant
      ? 'activeStay'
      : 'noPg';

  const canAccess = (gating: TenantAccessGating): boolean => {
    if (gating === 'none') return true;
    if (gating === 'auth') return isAuthenticated;
    return isAuthenticated && isLinkedTenant;
  };

  return {
    accessState,
    isGuest: accessState === 'guest',
    isNoPg: accessState === 'noPg',
    isActiveStay: accessState === 'activeStay',
    isLoading,
    canAccess,
  };
}
