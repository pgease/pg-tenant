import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import mascotEmpty512 from '../../assets/mascot/pgease-mascot-empty-512.webp';
import mascotError512 from '../../assets/mascot/pgease-mascot-error-512.webp';
import mascotOffline512 from '../../assets/mascot/pgease-mascot-offline-512.webp';

const ART = {
  empty: mascotEmpty512,
  error: mascotError512,
  offline: mascotOffline512,
} as const;

export function MascotEmptyState({
  variant = 'empty',
  title,
  message,
  actionLabel,
  onAction,
}: {
  variant?: 'empty' | 'error' | 'offline';
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8">
      <div className="w-[180px] h-[180px] rounded-full bg-[#E6F3F3] flex items-center justify-center mb-4">
        <img src={ART[variant]} alt={title} className="w-[152px] h-[152px] object-contain" />
      </div>
      <h3 className="text-[18px] font-semibold text-[#1F2937]">{title}</h3>
      <p className="text-[13px] text-[#1F2937]/70 mt-1.5 max-w-[280px] leading-relaxed">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 px-6 py-2.5 rounded-[14px] bg-[#008080] text-white text-[14px] font-semibold min-h-[44px]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function TenantOfflineBanner() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const capNet = (window as any).Capacitor?.Plugins?.Network;
    const listener = capNet?.addListener?.('networkStatusChange', (s: { connected: boolean }) => setOnline(s.connected));
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      void listener?.then?.((h: { remove: () => void }) => h.remove());
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-4 mt-2 rounded-xl bg-[#E6F3F3] border border-[#CCE6E6] border-l-4 border-l-[#005F5F] px-3.5 py-2.5 flex items-center justify-between gap-2"
    >
      <div className="flex items-center gap-2 min-w-0">
        <CloudOff className="h-4 w-4 text-[#005F5F] shrink-0" />
        <span className="text-[12px] font-semibold text-[#1F2937] truncate">
          You&apos;re offline — showing last saved data
        </span>
      </div>
      <button
        type="button"
        onClick={() => setOnline(navigator.onLine)}
        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#008080] text-[#008080] bg-white text-[11px] font-semibold"
      >
        <RefreshCw className="h-3 w-3" />
        <span>Retry</span>
      </button>
    </div>
  );
}
