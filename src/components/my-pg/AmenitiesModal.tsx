import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Users,
  Utensils,
  Sparkle,
  ShieldCheck,
  Camera,
  DoorClosed,
  AlertTriangle,
} from 'lucide-react';

interface SecurityDetails {
  depositAmount?: number;
  depositPaid?: number;
  refundPolicy?: string;
  gateClosingTime?: string;
  cctv?: boolean;
}

interface AmenitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  amenities?: any[];
  facilities?: any[];
  restrictions?: any[];
  security?: SecurityDetails;
}

const getItemName = (item: any): string => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.name || item.label || item.title || item.description || '';
};

const getRuleCategoryIcon = (ruleText: string) => {
  const lower = ruleText.toLowerCase();
  if (lower.includes('gate') || lower.includes('time') || lower.includes('curfew') || lower.includes('night') || lower.includes('pm') || lower.includes('am')) {
    return <Clock className="h-4 w-4 text-amber-600" />;
  }
  if (lower.includes('visitor') || lower.includes('guest') || lower.includes('entry') || lower.includes('friend') || lower.includes('male') || lower.includes('female')) {
    return <Users className="h-4 w-4 text-indigo-600" />;
  }
  if (lower.includes('food') || lower.includes('cook') || lower.includes('mess') || lower.includes('kitchen') || lower.includes('dining')) {
    return <Utensils className="h-4 w-4 text-emerald-600" />;
  }
  if (lower.includes('clean') || lower.includes('trash') || lower.includes('garbage') || lower.includes('wash')) {
    return <Sparkle className="h-4 w-4 text-teal-600" />;
  }
  if (lower.includes('smoke') || lower.includes('alcohol') || lower.includes('drink') || lower.includes('drug') || lower.includes('loud') || lower.includes('damage')) {
    return <AlertTriangle className="h-4 w-4 text-rose-600" />;
  }
  return <ShieldAlert className="h-4 w-4 text-amber-600" />;
};

export const AmenitiesModal: React.FC<AmenitiesModalProps> = ({
  isOpen,
  onClose,
  amenities = [],
  facilities = [],
  restrictions = [],
  security,
}) => {
  const [activeTab, setActiveTab] = useState<'amenities' | 'rules' | 'security'>('amenities');

  if (!isOpen) return null;

  const rawAmenities = Array.isArray(amenities) ? amenities : [];
  const rawFacilities = Array.isArray(facilities) ? facilities : [];
  const rawRestrictions = Array.isArray(restrictions) ? restrictions : [];

  const displayAmenities = [...rawAmenities, ...rawFacilities]
    .map(getItemName)
    .filter(Boolean);

  const displayRules = rawRestrictions
    .map(getItemName)
    .filter(Boolean);

  const depositAmount = security?.depositAmount ?? 0;
  const depositPaid = security?.depositPaid ?? 0;
  const gateClosingTime = security?.gateClosingTime || '10:30 PM';
  const refundPolicy = security?.refundPolicy || 'Refundable at checkout inspection after clearing dues and inventory verification.';
  const hasCctv = security?.cctv !== false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex flex-col w-full max-w-lg max-h-[90dvh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-teal-50 flex items-center justify-center text-primary font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brandText">House Rules & Security</h2>
              <p className="text-[11px] text-brandText-muted">Living guidelines, facilities & security policy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-brandText-muted hover:text-brandText tap-target"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-1.5 border-b border-gray-100 bg-gray-50/70 p-2">
          <button
            type="button"
            onClick={() => setActiveTab('amenities')}
            className={`flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition-all ${
              activeTab === 'amenities'
                ? 'bg-white text-primary shadow-xs'
                : 'text-brandText-muted hover:text-brandText'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Amenities ({displayAmenities.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition-all ${
              activeTab === 'rules'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-brandText-muted hover:text-brandText'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
            <span>Rules ({displayRules.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition-all ${
              activeTab === 'security'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-brandText-muted hover:text-brandText'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Security</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* 1. Amenities */}
          {activeTab === 'amenities' && (
            displayAmenities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
                {displayAmenities.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-2xs"
                  >
                    <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center text-primary shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-brandText truncate">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-xs text-gray-500">
                Your PG hasn't added amenities yet.
              </div>
            )
          )}

          {/* 2. House Rules */}
          {activeTab === 'rules' && (
            displayRules.length > 0 ? (
              <div className="space-y-2.5 animate-fade-in">
                {displayRules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-50 shrink-0 mt-0.5">
                      {getRuleCategoryIcon(rule)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-brandText leading-relaxed">{rule}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-xs text-gray-500">
                Your PG hasn't added house rules yet.
              </div>
            )
          )}

          {/* 3. Security & Deposit Policy */}
          {activeTab === 'security' && (
            <div className="space-y-3 animate-fade-in text-xs">
              <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-teal-900">Security Deposit Status</span>
                  <span className="font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full text-[11px]">
                    {depositPaid > 0 ? 'Deposit Recorded' : 'Standard Policy'}
                  </span>
                </div>
                {depositAmount > 0 && (
                  <p className="text-base font-black text-teal-950">
                    ₹{depositAmount.toLocaleString('en-IN')}
                  </p>
                )}
                <p className="text-[11px] text-teal-800/90 leading-relaxed">
                  {refundPolicy}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
                    <DoorClosed className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Gate Curfew</span>
                    <span className="font-bold text-gray-900 text-xs">{gateClosingTime}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 shrink-0">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">CCTV Surveillance</span>
                    <span className="font-bold text-gray-900 text-xs">{hasCctv ? '24x7 Active' : 'Not installed'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 text-[11px] text-gray-500 space-y-1">
                <p className="font-bold text-gray-700">Notice Period & Vacating:</p>
                <p>A minimum of 30 days written notice is required before moving out to ensure full refund of security deposit without deductions.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
