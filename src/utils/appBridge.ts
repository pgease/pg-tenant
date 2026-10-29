/**
 * PG Ease Native App Wrapper & Bridge Integration
 */

declare global {
  interface Window {
    PGEaseBridge?: {
      onNativeBack?: () => boolean;
      requestPushPermission?: () => Promise<string | null>;
      openNativeCamera?: () => Promise<string | null>;
      postMessageToNative?: (event: string, payload: any) => void;
    };
  }
}

const STORAGE_KEY = 'pgease_app_mode';

/**
 * Checks if the application is running inside the native mobile app wrapper
 * (via ?app=1 query param, PGEaseApp user agent, or persistent localStorage).
 */
export function isAppMode(): boolean {
  if (typeof window === 'undefined') return false;

  const urlParams = new URLSearchParams(window.location.search);
  const hasAppParam = urlParams.get('app') === '1';
  const hasUserAgent = window.navigator.userAgent.includes('PGEaseApp');
  const storedAppMode = localStorage.getItem(STORAGE_KEY) === 'true';

  if (hasAppParam || hasUserAgent) {
    localStorage.setItem(STORAGE_KEY, 'true');
    return true;
  }

  return storedAppMode;
}

/**
 * Initializes the PGEaseBridge and handles Android back button via history popstate
 */
export function initAppBridge(onBack?: () => boolean): () => void {
  if (typeof window === 'undefined') return () => {};

  if (!window.PGEaseBridge) {
    window.PGEaseBridge = {
      postMessageToNative: (event: string, payload: any) => {
        // Handshake for native WebView handlers (Capacitor or Flutter WebView)
        if ((window as any).webkit?.messageHandlers?.PGEaseNative) {
          (window as any).webkit.messageHandlers.PGEaseNative.postMessage({ event, payload });
        } else if ((window as any).PGEaseNativeChannel) {
          (window as any).PGEaseNativeChannel.postMessage(JSON.stringify({ event, payload }));
        }
      },
    };
  }

  // Handle Android Back Button navigation
  const handlePopState = (e: PopStateEvent) => {
    if (window.PGEaseBridge?.onNativeBack) {
      const handled = window.PGEaseBridge.onNativeBack();
      if (handled) {
        e.preventDefault();
        return;
      }
    }
    if (onBack) {
      const handled = onBack();
      if (handled) {
        e.preventDefault();
      }
    }
  };

  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}
