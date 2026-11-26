export interface FriendlyErrorResult {
  title: string;
  message: string;
  isNetwork: boolean;
}

/**
 * Central error mapper: never expose raw API validation arrays, stack traces, or "Failed to fetch" to users.
 */
export function friendlyError(err: unknown, fallbackTitle = 'Something went wrong'): FriendlyErrorResult {
  const rawObj = err as any;
  const status = rawObj?.response?.status ?? rawObj?.status;
  const rawMsg = String(
    rawObj?.response?.data?.message ?? rawObj?.message ?? '',
  ).toLowerCase();

  if (
    !navigator.onLine ||
    rawMsg.includes('failed to fetch') ||
    rawMsg.includes('network error') ||
    rawMsg.includes('err_internet') ||
    rawMsg.includes('timeout') ||
    rawObj?.code === 'ERR_NETWORK'
  ) {
    return {
      title: 'No internet connection',
      message: 'Check your Wi-Fi or mobile data and try again.',
      isNetwork: true,
    };
  }

  if (status === 400 || rawMsg.includes('distance') || rawMsg.includes('must not be')) {
    return {
      title: 'Please adjust your filters',
      message: 'Try a different search filter or distance range and try again.',
      isNetwork: false,
    };
  }

  if (status === 401) {
    return {
      title: 'Sign in required',
      message: 'Please sign in with your mobile number to continue.',
      isNetwork: false,
    };
  }

  if (status >= 500) {
    return {
      title: 'Server temporarily unavailable',
      message: 'Please try again in a moment.',
      isNetwork: false,
    };
  }

  return {
    title: fallbackTitle,
    message: 'We could not complete this right now. Please try again in a moment.',
    isNetwork: false,
  };
}
