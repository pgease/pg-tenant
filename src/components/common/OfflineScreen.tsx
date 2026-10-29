import React from 'react';
import { WifiOff, RotateCw } from 'lucide-react';

interface OfflineScreenProps {
  onRetry: () => void;
}

export const OfflineScreen: React.FC<OfflineScreenProps> = ({ onRetry }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-50 text-primary">
        <WifiOff className="h-12 w-12 text-primary" strokeWidth={1.8} />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500"></span>
        </span>
      </div>

      <h2 className="text-2xl font-bold text-brandText">No Internet Connection</h2>
      <p className="mt-2 max-w-xs text-sm text-brandText-muted">
        It looks like you're offline. Please check your network connection and try again.
      </p>

      <button
        onClick={onRetry}
        className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all active:scale-95 hover:bg-primary-dark tap-target"
      >
        <RotateCw className="h-5 w-5" />
        Retry Connection
      </button>

      <p className="mt-6 text-xs text-brandText-light">
        PG Ease • Offline Mode
      </p>
    </div>
  );
};
