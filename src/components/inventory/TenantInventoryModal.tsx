import React, { useState, useEffect } from 'react';
import {
  Package,
  Bed,
  Tv,
  CheckCircle2,
  ShieldCheck,
  Tag,
  X,
  Loader2,
} from 'lucide-react';
import {
  inventoryService,
  type TenantInventorySnapshot,
} from '../../services/inventoryService';

interface TenantInventoryModalProps {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  roomNumber?: string;
  bedNumber?: string;
}

export const TenantInventoryModal: React.FC<TenantInventoryModalProps> = ({
  open,
  onClose,
  tenantId,
  roomNumber = '301',
  bedNumber = '1',
}) => {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<TenantInventorySnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<'bed' | 'room'>('bed');

  useEffect(() => {
    if (open) {
      setLoading(true);
      inventoryService
        .getTenantInventory(tenantId, roomNumber, bedNumber)
        .then((data) => setSnapshot(data))
        .finally(() => setLoading(false));
    }
  }, [open, tenantId, roomNumber, bedNumber]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#004D4D] to-[#008080] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                Items Given to Me
                <span className="rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] px-2 py-0.5 border border-emerald-400/30">
                  Move-In Verified
                </span>
              </h3>
              <p className="text-[11px] text-white/80">
                Annexure A Handover • Room {roomNumber}, Bed {bedNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs: Bed Items vs Room Shared Items */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 p-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('bed')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'bed'
                ? 'bg-white text-teal-800 shadow-sm border border-teal-100'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Bed className="h-4 w-4 text-teal-600" />
            <span>My Bed Items ({snapshot?.bedItems.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('room')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'room'
                ? 'bg-white text-teal-800 shadow-sm border border-teal-100'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Tv className="h-4 w-4 text-teal-600" />
            <span>Room Shared ({snapshot?.roomItems.length || 0})</span>
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-teal-600" />
            <p className="text-xs text-gray-400 mt-2">Loading your handover checklist...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {/* Agreement Notice Banner */}
            <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-3 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-teal-700 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-[11px] text-teal-900">
                <span className="font-bold">E-Signed Rent Agreement Checklist</span>
                <p className="text-teal-800/80 leading-relaxed">
                  These items were formally handed over at move-in as part of your digital rental agreement.
                  At checkout, this list is verified for security deposit return.
                </p>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              {(activeTab === 'bed' ? snapshot?.bedItems : snapshot?.roomItems)?.map(
                (item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-gray-100 bg-white p-3 shadow-xs hover:border-gray-200 transition-all flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-xs">{item.name}</span>
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                          Qty: {item.qty}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Condition: <strong className="capitalize text-gray-700">{item.condition}</strong>
                        </span>
                        {item.serialOrTag && (
                          <span className="flex items-center gap-1 text-gray-400">
                            <Tag className="h-3 w-3" /> {item.serialOrTag}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        item.condition === 'new'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      Verified
                    </span>
                  </div>
                )
              )}
            </div>

            {/* Footer Legal Clause */}
            <div className="rounded-xl bg-gray-50 p-2.5 text-[10px] text-gray-500 italic leading-relaxed border border-gray-100">
              "Items listed in Annexure A shall be returned in the same condition at checkout, normal wear and tear excepted."
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="border-t border-gray-100 p-3.5 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-teal-700 py-3 text-xs font-bold text-white shadow-md hover:bg-teal-800 active:scale-[0.98] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
