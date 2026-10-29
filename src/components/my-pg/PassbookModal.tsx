import React, { useEffect, useState } from 'react';
import { X, Receipt, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { tenantService } from '../../services/tenantService';

interface PassbookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PassbookModal: React.FC<PassbookModalProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      tenantService
        .getRentHistory()
        .then((res) => {
          const list = Array.isArray(res) ? res : res.collections || res.data || [];
          setHistory(list);
        })
        .catch((err) => console.error('Failed to load passbook history:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-md max-h-[90dvh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 font-bold">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brandText">Payment Passbook</h2>
              <p className="text-[11px] text-brandText-muted">Receipts & Payment History</p>
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
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-brandText-muted">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-xs">Loading payment records...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-brandText-muted">
              <Receipt className="h-10 w-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-brandText">No Payment History Yet</p>
              <p className="text-xs mt-1">Receipts will appear here once rent payments are processed.</p>
            </div>
          ) : (
            history.map((item, index) => {
              const isPaid = item.status === 'paid';
              return (
                <div
                  key={item.id || index}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-gray-200 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-brandText">
                        {item.periodYear ? `${item.periodYear}-${String(item.periodMonth).padStart(2, '0')}` : 'Rent Collection'}
                      </span>
                      <p className="text-[10px] text-brandText-muted">
                        {item.paidAt ? new Date(item.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending reconciliation'}
                      </p>
                    </div>

                    <span
                      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {isPaid ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {isPaid ? 'PAID' : item.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                    <span className="text-brandText-muted">
                      Method: <strong className="text-brandText capitalize">{item.paymentMethod || 'UPI / Gateway'}</strong>
                    </span>
                    <span className="text-sm font-black text-brandText">
                      ₹{Number(item.amountPaid || item.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
