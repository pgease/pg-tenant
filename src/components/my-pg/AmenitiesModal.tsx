import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface AmenitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  amenities?: string[];
  facilities?: string[];
  restrictions?: string[];
}

export const AmenitiesModal: React.FC<AmenitiesModalProps> = ({
  isOpen,
  onClose,
  amenities = [],
  facilities = [],
  restrictions = [],
}) => {
  const [activeTab, setActiveTab] = useState<'amenities' | 'rules'>('amenities');

  if (!isOpen) return null;

  const displayAmenities = [...amenities, ...facilities];
  const displayRules = restrictions;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-md max-h-[90dvh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center text-primary font-bold">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brandText">Living & House Guide</h2>
              <p className="text-[11px] text-brandText-muted">Amenities, Facilities & Rules</p>
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
        <div className="grid grid-cols-2 gap-2 border-b border-gray-100 bg-gray-50/60 p-2">
          <button
            onClick={() => setActiveTab('amenities')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
              activeTab === 'amenities'
                ? 'bg-white text-primary shadow-sm'
                : 'text-brandText-muted hover:text-brandText'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Amenities ({displayAmenities.length})
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
              activeTab === 'rules'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-brandText-muted hover:text-brandText'
            }`}
          >
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            House Rules ({displayRules.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {activeTab === 'amenities' && (
            displayAmenities.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5 animate-fade-in">
                {displayAmenities.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm"
                  >
                    <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center text-primary flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-brandText">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-xs text-gray-400">
                No specific amenities recorded for this PG stay.
              </div>
            )
          )}

          {activeTab === 'rules' && (
            displayRules.length > 0 ? (
              <div className="space-y-2.5 animate-fade-in">
                {displayRules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-xs text-brandText leading-relaxed">{rule}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-xs text-gray-400">
                No custom house rules or restrictions recorded for this PG stay.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
