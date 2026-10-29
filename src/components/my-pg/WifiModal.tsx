import React, { useState } from 'react';
import { X, Wifi, Copy, Check, Shield } from 'lucide-react';

interface WifiModalProps {
  isOpen: boolean;
  onClose: () => void;
  wifiData: {
    ssid?: string;
    password?: string;
    details?: string;
  } | null;
}

export const WifiModal: React.FC<WifiModalProps> = ({ isOpen, onClose, wifiData }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const ssid = wifiData?.ssid || 'PG-EASE-HIGH-SPEED';
  const password = wifiData?.password || 'StaySafe@2026';

  const copyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center text-primary font-bold">
              <Wifi className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brandText">Floor WiFi Credentials</h2>
              <p className="text-[11px] text-brandText-muted">High-Speed Resident Internet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-brandText-muted hover:text-brandText tap-target"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-teal-50/50 border border-teal-100 text-center">
            <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center text-primary shadow-sm mb-3">
              <Wifi className="h-8 w-8" />
            </div>
            <span className="text-xs font-semibold text-brandText-muted">Network Name (SSID)</span>
            <p className="text-lg font-black text-brandText tracking-tight">{ssid}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-brandText-muted uppercase tracking-wider block">
                  WiFi Password
                </span>
                <span className="text-base font-mono font-bold text-brandText">{password}</span>
              </div>

              <button
                onClick={copyPassword}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark active:scale-95 transition-all tap-target"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy Password'}
              </button>
            </div>

            {wifiData?.details && (
              <p className="text-[11px] text-brandText-muted border-t border-gray-200/60 pt-2">
                {wifiData.details}
              </p>
            )}
          </div>

          <div className="rounded-xl bg-teal-50/50 p-3 flex items-center gap-2 border border-teal-100/60">
            <Shield className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-[11px] text-brandText-muted leading-tight">
              Please do not share resident WiFi with outside visitors to keep network speeds optimal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
