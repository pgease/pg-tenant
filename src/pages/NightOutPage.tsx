import React, { useState, useEffect } from 'react';
import {
  Moon,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenantService, type NightOutRequest } from '../services/tenantService';
import { useAuth } from '../context/AuthContext';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const DATE_OPTIONS = Array.from({ length: 21 }, (_, index) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + index);
  const when = date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const label = index === 0 ? `Today · ${when}` : index === 1 ? `Tomorrow · ${when}` : when;
  return { value: dateKey(date), label };
});

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? '00' : '30';
  const value = `${pad(hours)}:${minutes}`;
  const label = new Date(2026, 0, 1, hours, Number(minutes)).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return { value, label };
});

function combineWhen(day: string, time: string): Date | null {
  if (!day || !time) return null;
  const date = new Date(`${day}T${time}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const NightOutPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, propertyDetails } = useAuth();

  const [nightOutList, setNightOutList] = useState<NightOutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [leaveDay, setLeaveDay] = useState(DATE_OPTIONS[0].value);
  const [leaveTime, setLeaveTime] = useState('21:00');
  const [returnDay, setReturnDay] = useState(DATE_OPTIONS[1]?.value || DATE_OPTIONS[0].value);
  const [returnTime, setReturnTime] = useState('08:00');
  const [reason, setReason] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [contactDuringStay, setContactDuringStay] = useState('');
  const [parentConsentConfirmed, setParentConsentConfirmed] = useState(false);

  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await tenantService.getNightOutRequests();
      setNightOutList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load night out requests:', e);
      setNightOutList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const leaveAt = combineWhen(leaveDay, leaveTime);
    const returnAt = combineWhen(returnDay, returnTime);

    if (!leaveAt || !returnAt) {
      setErrorMsg('Please select valid departure and return date & time.');
      return;
    }

    if (returnAt.getTime() <= leaveAt.getTime()) {
      setErrorMsg('Return date and time must be after the departure date.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await tenantService.createNightOutRequest({
        leaveDate: leaveAt.toISOString(),
        returnDate: returnAt.toISOString(),
        reason: reason.trim() || undefined,
        destinationAddress: destinationAddress.trim() || undefined,
        contactDuringStay: contactDuringStay.trim() || undefined,
        parentConsentConfirmed,
      });

      setMsg('Night out request recorded and submitted to property manager.');
      setShowForm(false);
      setReason('');
      setDestinationAddress('');
      setContactDuringStay('');
      setParentConsentConfirmed(false);

      if (created) {
        setNightOutList((prev) => [created, ...prev]);
      } else {
        loadData();
      }
      setTimeout(() => setMsg(''), 4500);
    } catch (err: any) {
      const errText = err.response?.data?.message || err.message || 'Failed to submit night out request.';
      setErrorMsg(Array.isArray(errText) ? errText[0] : errText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-1 pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brandText tap-target"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setErrorMsg('');
          }}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{showForm ? 'View Logs' : 'New Night Out'}</span>
        </button>
      </div>

      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-950 p-5 text-white shadow-lg space-y-1.5">
        <div className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-indigo-300" />
          <h2 className="text-base font-bold tracking-tight">Night Out Intimation</h2>
        </div>
        <p className="text-xs text-indigo-200/90 leading-relaxed">
          Log late night stays, weekend departures, and overnight leaves for safety and security at{' '}
          {propertyDetails?.property?.name || 'your PG'}.
        </p>
      </div>

      {msg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {showForm ? (
        /* Night Out Form */
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-4.5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
            <Moon className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-brandText">Submit Night Out Request</h3>
          </div>

          {/* Departure */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">Departure Date & Time</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={leaveDay}
                onChange={(e) => setLeaveDay(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2 text-xs font-medium text-brandText focus:border-indigo-600 focus:bg-white focus:outline-none"
              >
                {DATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={leaveTime}
                onChange={(e) => setLeaveTime(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2 text-xs font-medium text-brandText focus:border-indigo-600 focus:bg-white focus:outline-none"
              >
                {TIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Return */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">Expected Return Date & Time</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={returnDay}
                onChange={(e) => setReturnDay(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2 text-xs font-medium text-brandText focus:border-indigo-600 focus:bg-white focus:outline-none"
              >
                {DATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2 text-xs font-medium text-brandText focus:border-indigo-600 focus:bg-white focus:outline-none"
              >
                {TIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Reason for Night Out</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Visiting home, exam prep, office work, family trip"
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-medium text-brandText focus:border-indigo-600 focus:outline-none"
              required
            />
          </div>

          {/* Destination */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Destination Address (Optional)</label>
            <input
              type="text"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder="City, locality, or home address"
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-medium text-brandText focus:border-indigo-600 focus:outline-none"
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Emergency Contact Number (Optional)</label>
            <input
              type="tel"
              value={contactDuringStay}
              onChange={(e) => setContactDuringStay(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-medium text-brandText focus:border-indigo-600 focus:outline-none"
            />
          </div>

          {/* Parent Consent Checkbox */}
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={parentConsentConfirmed}
              onChange={(e) => setParentConsentConfirmed(e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs text-gray-600 leading-snug">
              I confirm that my parents/guardians are informed of this overnight leave.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{submitting ? 'Submitting...' : 'Submit Night Out Intimation'}</span>
          </button>
        </form>
      ) : (
        /* Night Out Logs List */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-brandText uppercase tracking-wider">
              Recorded Movement Logs ({nightOutList.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs font-medium text-gray-500">Loading night out requests...</p>
            </div>
          ) : nightOutList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Moon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-brandText">No Night Out Logs</h3>
              <p className="text-xs text-gray-400">
                You haven't submitted any overnight leaves yet.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Submit First Request</span>
              </button>
            </div>
          ) : (
            nightOutList.map((item) => {
              const status = (item.status || 'pending').toLowerCase();
              const isApproved = status === 'approved';
              const isRejected = status === 'rejected';

              const leaveFormatted = item.leaveDate
                ? new Date(item.leaveDate).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : '—';

              const returnFormatted = item.returnDate
                ? new Date(item.returnDate).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : '—';

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <Moon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brandText">
                          {item.reason || 'Night Out Intimation'}
                        </h4>
                        <span className="text-[10px] text-gray-400">
                          {item.destinationAddress || 'Standard Leave'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700'
                          : isRejected
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.status || 'Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">DEPARTURE</span>
                      <span className="font-bold text-brandText">{leaveFormatted}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">RETURN</span>
                      <span className="font-bold text-brandText">{returnFormatted}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
