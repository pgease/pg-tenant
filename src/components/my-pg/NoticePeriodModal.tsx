import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  Loader2,
  XCircle,
} from 'lucide-react';
import { tenantService } from '../../services/tenantService';

interface NoticePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  noticeData?: any;
  onStatusChanged?: () => void;
}

export const NoticePeriodModal: React.FC<NoticePeriodModalProps> = ({
  isOpen,
  onClose,
  noticeData,
  onStatusChanged,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [reason, setReason] = useState('Job relocation');
  const [vacateOn, setVacateOn] = useState('');
  const [remarks, setRemarks] = useState('');

  const isUnderNotice = Boolean(noticeData && (noticeData.status === 'UNDER_NOTICE' || noticeData.noticeRaisedOn));

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      // Default vacate date: 30 days from today
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setVacateOn(defaultDate.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRaiseNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await tenantService.raiseNotice({
        reason,
        vacateOn,
        remarks,
      });
      setSuccessMsg('Notice period successfully submitted to your PG owner.');
      setTimeout(() => {
        onStatusChanged?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to raise notice period. Please check requirements.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNotice = async () => {
    if (!window.confirm('Are you sure you want to cancel your move-out notice? Your active stay will continue.')) {
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await tenantService.cancelNotice();
      setSuccessMsg('Notice period has been cancelled. Your stay status is ACTIVE.');
      setTimeout(() => {
        onStatusChanged?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to cancel notice.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-md max-h-[90dvh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 font-bold">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brandText">Notice Period Manager</h2>
              <p className="text-[11px] text-brandText-muted">Move-out Request & Vacate Date</p>
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
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-teal-50 p-3 text-xs text-teal-800 border border-teal-200">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Status Banner */}
          <div
            className={`rounded-2xl p-4 border flex items-center justify-between ${
              isUnderNotice
                ? 'border-amber-200 bg-amber-50/70 text-amber-900'
                : 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                Current Stay Status
              </span>
              <p className="text-base font-bold">
                {isUnderNotice ? 'UNDER NOTICE' : 'ACTIVE OCCUPANCY'}
              </p>
              {isUnderNotice && noticeData?.scheduledMoveOutDate && (
                <p className="text-xs font-semibold mt-0.5">
                  Scheduled Move-Out: {noticeData.scheduledMoveOutDate}
                </p>
              )}
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                isUnderNotice ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'
              }`}
            >
              {isUnderNotice ? 'Moving Out' : 'Active'}
            </span>
          </div>

          {/* Policy Info */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 text-xs text-brandText-muted space-y-1">
            <p className="font-semibold text-brandText">Notice Period Policy:</p>
            <p>• Minimum 30 days mandatory notice before vacating bed.</p>
            <p>• Security deposit will be refunded after room inspection and electricity settlement.</p>
          </div>

          {/* ACTIONS */}
          {isUnderNotice ? (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-brandText-muted">
                Changed your mind? You can cancel your notice and continue your stay if the bed hasn't been reallocated.
              </p>
              <button
                type="button"
                onClick={handleCancelNotice}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-xs font-bold text-white shadow-md shadow-red-600/20 active:scale-95 hover:bg-red-700 disabled:opacity-50 transition-all tap-target"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel Notice Period'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleRaiseNotice} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-brandText-muted mb-1">
                  Reason for Moving Out
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                >
                  <option value="Job relocation">Job / College Relocation</option>
                  <option value="Found another place">Found another accommodation</option>
                  <option value="Returning home">Returning home</option>
                  <option value="Completed internship">Completed college / internship</option>
                  <option value="Personal reasons">Personal reasons</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brandText-muted mb-1">
                  Expected Vacate Date (Minimum 30 days ahead)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={vacateOn}
                    onChange={(e) => setVacateOn(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brandText-muted mb-1">
                  Remarks / Notes for Owner (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Any specific instructions or forwarding notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-brandText focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 active:scale-95 hover:bg-amber-700 disabled:opacity-50 transition-all tap-target"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Notice...
                  </>
                ) : (
                  'Raise Notice Period'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
