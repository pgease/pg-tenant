import React, { useState } from 'react';
import { Wifi, Copy, Check, ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const WifiPage: React.FC = () => {
  const navigate = useNavigate();
  const { propertyDetails } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const wifi = propertyDetails?.wifi || null;
  const ssid = wifi?.ssid || null;
  const password = wifi?.password || null;

  const copyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pt-1 pb-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brandText tap-target"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-primary">
          Wi-Fi Network
        </span>
      </div>

      {/* Main WiFi Card */}
      {ssid ? (
        <div className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-primary">
            <Wifi className="h-8 w-8" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Network Name (SSID)</span>
            <h2 className="text-xl font-black text-brandText mt-0.5">{ssid}</h2>
          </div>

          {password ? (
            <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/40 p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">Password</span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-base font-bold text-brandText">
                  {showPassword ? password : '••••••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={copyPassword}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-primary shadow-xs hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-teal-50/60 p-3 text-xs font-semibold text-teal-800">
              Open Network (No password required)
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-primary">
            <Wifi className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brandText">Your PG hasn't added Wi-Fi details yet</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
              The property manager has not yet published the Wi-Fi router network and password for this PG. Please ask your caretaker.
            </p>
          </div>
        </div>
      )}

      {/* Connection Guidelines */}
      <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 space-y-2 text-xs text-gray-600">
        <h4 className="font-bold text-brandText flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-primary" />
          Network Usage Guidelines
        </h4>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-500">
          <li>Network is reserved for registered tenants of {propertyDetails?.property?.name || 'the PG'}.</li>
          <li>For optimal speed, connect to the 5GHz frequency band.</li>
          <li>Heavy torrenting or unauthorized commercial broadcasting is prohibited.</li>
        </ul>
      </div>
    </div>
  );
};
