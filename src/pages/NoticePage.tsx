import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  PackageCheck,
  ShieldAlert,
  ThumbsUp,
  MessageSquare,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenantService } from '../services/tenantService';
import { inventoryService, type TenantCheckoutSummary } from '../services/inventoryService';
import { useAuth } from '../context/AuthContext';

export const NoticePage: React.FC = () => {
  const navigate = useNavigate();
  const { propertyDetails, checkTenancy } = useAuth();

  const [noticeData, setNoticeData] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [vacateDate, setVacateDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  // Checkout Inventory State
  const [checkoutSummary, setCheckoutSummary] = useState<TenantCheckoutSummary | null>(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeText, setDisputeText] = useState('');
  const [acknowledging, setAcknowledging] = useState(false);

  const loadNotice = async () => {
    try {
      const data = await tenantService.getNoticePeriod();
      setNoticeData(data);
    } catch {
      // Graceful fallback
    }

    const tenantId = propertyDetails?.roomTenant?.id || 't1';
    inventoryService
      .getCheckoutSummary(tenantId)
      .then((summary) => setCheckoutSummary(summary))
      .catch(() => {});
  };

  const handleAgree = async () => {
    const tenantId = propertyDetails?.roomTenant?.id || 't1';
    setAcknowledging(true);
    try {
      await inventoryService.acknowledgeCheckout(tenantId, { agree: true });
      const updated = await inventoryService.getCheckoutSummary(tenantId);
      setCheckoutSummary(updated);
      setMsg('You have successfully agreed to the checkout inventory inspection & deposit settlement.');
    } catch {
      alert('Failed to submit agreement.');
    } finally {
      setAcknowledging(false);
    }
  };

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeText.trim()) return;
    const tenantId = propertyDetails?.roomTenant?.id || 't1';
    setAcknowledging(true);
    try {
      await inventoryService.acknowledgeCheckout(tenantId, {
        agree: false,
        disputeNote: disputeText.trim(),
      });
      const updated = await inventoryService.getCheckoutSummary(tenantId);
      setCheckoutSummary(updated);
      setDisputeModalOpen(false);
      setDisputeText('');
      setMsg('Dispute note submitted. The owner has been notified in-app.');
    } catch {
      alert('Failed to submit dispute.');
    } finally {
      setAcknowledging(false);
    }
  };

  useEffect(() => {
    loadNotice();
  }, []);

  const handleRaiseNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacateDate) {
      alert('Please select expected vacate date.');
      return;
    }

    setSubmitting(true);
    try {
      await tenantService.raiseNotice({
        reason,
        vacateOn: vacateDate,
        remarks,
      });
      setMsg('Notice request submitted successfully.');
      loadNotice();
      checkTenancy();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit notice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelNotice = async () => {
    if (!window.confirm('Are you sure you want to cancel your checkout notice?')) return;
    setSubmitting(true);
    try {
      await tenantService.cancelNotice();
      setMsg('Notice cancelled successfully.');
      loadNotice();
      checkTenancy();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel notice.');
    } finally {
      setSubmitting(false);
    }
  };

  const isUnderNotice = Boolean(
    noticeData?.isUnderNotice ||
    noticeData?.notice?.isOnNotice ||
    propertyDetails?.roomTenant?.status === 'UNDER_NOTICE' ||
    propertyDetails?.roomTenant?.isOnNotice
  );

  const noticeStartedDate =
    noticeData?.notice?.noticeStartedAt ||
    propertyDetails?.roomTenant?.noticeStartedAt ||
    propertyDetails?.roomTenant?.startDate;

  const vacateDateVal =
    noticeData?.notice?.vacateOn ||
    propertyDetails?.roomTenant?.vacateOn;

  const daysLeft =
    noticeData?.notice?.daysUntilVacate != null
      ? noticeData.notice.daysUntilVacate
      : vacateDateVal
      ? Math.ceil((new Date(vacateDateVal).getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
      : null;

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
          30-Day Policy
        </span>
      </div>

      {msg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {isUnderNotice ? (
        <>
          {/* Active Notice Status Card */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Clock className="h-5 w-5 text-amber-600" />
              <span>Active Move-Out Notice</span>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
              Under Notice
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-white/90 p-3 rounded-xl border border-amber-200/60">
            <div>
              <span className="text-[10px] text-gray-500 block font-semibold">NOTICE SERVED</span>
              <span className="font-bold text-gray-900">
                {noticeStartedDate ? new Date(noticeStartedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block font-semibold">SCHEDULED VACATE</span>
              <span className="font-bold text-amber-900 underline">
                {vacateDateVal ? new Date(vacateDateVal).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Scheduled'}
              </span>
            </div>
          </div>

          {daysLeft != null && (
            <p className="text-xs font-semibold text-amber-800">
              ⏳ {daysLeft > 0 ? `${daysLeft} days remaining until move-out` : daysLeft === 0 ? 'Vacating today' : 'Notice period completed'}
            </p>
          )}

          <p className="text-xs text-amber-900/90 leading-relaxed">
            Your checkout notice has been registered with the property manager. Please coordinate with the owner for room inspection, key handover, and security deposit settlement.
          </p>

          <button
            type="button"
            onClick={handleCancelNotice}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100/50 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>Cancel Notice Request</span>
          </button>
        </div>

        {/* CHECKOUT INVENTORY INSPECTION & SETTLEMENT CARD */}
        {checkoutSummary && (
          <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Checkout Inspection & Deductions</h4>
                  <p className="text-[11px] text-gray-500">
                    Inspected on {checkoutSummary.inspectedAt || 'Recent Inspection'}
                  </p>
                </div>
              </div>

              {checkoutSummary.status === 'agreed' ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Agreed
                </span>
              ) : checkoutSummary.status === 'disputed' ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" /> Disputed
                </span>
              ) : (
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-800">
                  Pending Review
                </span>
              )}
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                Inspected Items ({checkoutSummary.items.length})
              </span>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50 text-xs">
                {checkoutSummary.items.map((item, idx) => (
                  <div key={idx} className="p-2.5 px-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-900 block">{item.name}</span>
                      {item.note && <p className="text-[10px] text-rose-600 mt-0.5">{item.note}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          item.status === 'ok'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'damaged'
                            ? 'bg-amber-100 text-amber-800'
                            : item.status === 'missing'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.deductionInr > 0 && (
                        <span className="font-bold text-rose-600 text-xs">
                          -₹{item.deductionInr}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settlement Totals Card */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-gray-600">
                <span>Security Deposit Held:</span>
                <span className="font-bold text-gray-900">
                  ₹{checkoutSummary.securityDeposit.toLocaleString('en-IN')}
                </span>
              </div>
              {checkoutSummary.pendingRentDues > 0 && (
                <div className="flex justify-between items-center text-gray-600">
                  <span>Pending Dues:</span>
                  <span className="font-bold text-rose-600">
                    -₹{checkoutSummary.pendingRentDues.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {checkoutSummary.totalDeductions > 0 && (
                <div className="flex justify-between items-center text-gray-600">
                  <span>Inventory Deductions:</span>
                  <span className="font-bold text-rose-600">
                    -₹{checkoutSummary.totalDeductions.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center font-bold">
                <span className="text-gray-900">
                  {checkoutSummary.isBalanceDue ? 'Balance Due:' : 'Net Refund Amount:'}
                </span>
                <span
                  className={`text-sm ${
                    checkoutSummary.isBalanceDue ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  ₹
                  {(checkoutSummary.isBalanceDue
                    ? checkoutSummary.balanceDueAmount
                    : checkoutSummary.refundAmount
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* User Acknowledgment status or Actions */}
            {checkoutSummary.status === 'agreed' ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>You have accepted the inventory inspection and final refund settlement.</span>
              </div>
            ) : checkoutSummary.status === 'disputed' ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <span>Dispute Recorded</span>
                </div>
                <p className="text-[11px] text-amber-900/80">
                  Note: "{checkoutSummary.disputeNote}". The owner has received your dispute note for resolution.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAgree}
                  disabled={acknowledging}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-teal-700 py-3 text-xs font-bold text-white shadow-md hover:bg-teal-800 active:scale-95 transition-all disabled:opacity-50"
                >
                  {acknowledging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                  <span>Agree & Confirm</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(true)}
                  disabled={acknowledging}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 py-3 text-xs font-bold text-amber-900 hover:bg-amber-100 active:scale-95 transition-all disabled:opacity-50"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-amber-700" />
                  <span>Raise Dispute</span>
                </button>
              </div>
            )}
          </div>
        )}
        </>
      ) : (
        /* Raise Notice Form */
        <form onSubmit={handleRaiseNotice} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-brandText">Submit Checkout Notice</h3>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Expected Vacate Date</label>
            <input
              type="date"
              value={vacateDate}
              onChange={(e) => setVacateDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Reason for Move Out</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:bg-white focus:outline-none"
            >
              <option value="">Select reason...</option>
              <option value="job_relocation">Job Relocation</option>
              <option value="course_completed">Course Completed / Graduated</option>
              <option value="moving_with_family">Moving with Family / Friends</option>
              <option value="rent_budget">Rent / Budget considerations</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Remarks or Feedback</label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any additional information for the property manager..."
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{submitting ? 'Submitting...' : 'Submit 30-Day Notice'}</span>
          </button>
        </form>
      )}

      {/* Policy Details */}
      <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 space-y-2 text-xs text-gray-600">
        <h4 className="font-bold text-brandText flex items-center gap-1.5">
          <AlertCircle className="h-4 w-4 text-primary" />
          Notice Period Policy
        </h4>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-500">
          <li>As per standard PG agreement, minimum 30 days notice is mandatory.</li>
          <li>Security deposit is calculated against room inspection and refunded after handover.</li>
        </ul>
      </div>

      {/* Raise Dispute Modal */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-bold text-gray-900">Dispute Inspection Item</h3>
              </div>
              <button
                type="button"
                onClick={() => setDisputeModalOpen(false)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              If an item was marked damaged or missing incorrectly, describe your clarification below. The owner will be notified to review the deduction before closing settlement.
            </p>

            <form onSubmit={handleDispute} className="space-y-3">
              <textarea
                rows={3}
                placeholder="e.g. The almirah key was already bent when I moved in, please check move-in photos."
                value={disputeText}
                onChange={(e) => setDisputeText(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 p-3 text-xs focus:border-teal-600 focus:outline-none"
                required
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={acknowledging || !disputeText.trim()}
                  className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {acknowledging ? 'Submitting...' : 'Submit Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
