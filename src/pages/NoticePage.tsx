import React, { useState, useEffect } from 'react';
import { Calendar, ArrowLeft, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenantService } from '../services/tenantService';
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

  const loadNotice = async () => {
    try {
      const data = await tenantService.getNoticePeriod();
      setNoticeData(data);
    } catch {
      // Graceful fallback
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

  const isUnderNotice = noticeData?.isUnderNotice || propertyDetails?.roomTenant?.status === 'UNDER_NOTICE';

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
        /* Active Notice Status Card */
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <Clock className="h-5 w-5 text-amber-600" />
            <span>Active Move-Out Notice</span>
          </div>

          <p className="text-xs text-amber-900 leading-relaxed">
            Your checkout notice has been registered with the property manager. Please coordinate with the owner for room inspection and security deposit settlement.
          </p>

          <button
            type="button"
            onClick={handleCancelNotice}
            disabled={submitting}
            className="w-full rounded-xl border border-amber-300 bg-white py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100/50"
          >
            Cancel Notice Request
          </button>
        </div>
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
    </div>
  );
};
