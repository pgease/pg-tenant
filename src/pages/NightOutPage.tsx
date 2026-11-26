import React, { useState, useEffect, useMemo } from 'react';
import {
  Moon,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenantService, type NightOutRequest } from '../services/tenantService';
import { useAuth } from '../context/AuthContext';
import { ListSkeleton } from '../components/ui/ListSkeleton';
import { InlineError } from '../components/ui/InlineError';
import { NativeDatePicker } from '../components/common/NativeDatePicker';
import {
  formatDateToDDMMYYYY,
  formatDateTimeToDDMMYYYY,
  getKolkataTodayYYYYMMDD,
} from '../utils/dateUtils';

function formatDDMMYYYY(dateVal: string | Date | null | undefined): string {
  return formatDateTimeToDDMMYYYY(dateVal);
}

function formatDateOnly(dateVal: string | Date | null | undefined): string {
  return formatDateToDDMMYYYY(dateVal) || '—';
}

export const NightOutPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, propertyDetails } = useAuth();

  const [nightOutList, setNightOutList] = useState<NightOutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Drawer / View state
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');

  // Form Fields (Asia/Kolkata timezone default)
  const todayKolkata = getKolkataTodayYYYYMMDD(0);
  const tomorrowKolkata = getKolkataTodayYYYYMMDD(1);
  const [leaveDate, setLeaveDate] = useState(todayKolkata);
  const [leaveTime, setLeaveTime] = useState('21:00');
  const [returnDate, setReturnDate] = useState(tomorrowKolkata);
  const [returnTime, setReturnTime] = useState('08:00');
  const [reason, setReason] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [contactDuringStay, setContactDuringStay] = useState('');
  const [parentConsentConfirmed, setParentConsentConfirmed] = useState(false);

  // Filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const loadData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await tenantService.getNightOutRequests();
      setNightOutList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load night out requests:', err);
      setError('Could not load night out requests. Please try again.');
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
    setFormError('');

    if (!leaveDate || !leaveTime) {
      setFormError('Please select departure date and time.');
      return;
    }
    if (!returnDate || !returnTime) {
      setFormError('Please select expected return date and time.');
      return;
    }

    const leaveDateTime = new Date(`${leaveDate}T${leaveTime}:00`);
    const returnDateTime = new Date(`${returnDate}T${returnTime}:00`);

    if (isNaN(leaveDateTime.getTime())) {
      setFormError('Invalid departure date & time.');
      return;
    }
    if (isNaN(returnDateTime.getTime())) {
      setFormError('Invalid return date & time.');
      return;
    }

    if (returnDateTime.getTime() <= leaveDateTime.getTime()) {
      setFormError('Expected return date & time must be strictly after departure date & time.');
      return;
    }

    if (!reason.trim()) {
      setFormError('Please provide a reason for the overnight leave.');
      return;
    }

    const cleanContact = contactDuringStay.replace(/\D/g, '');
    if (cleanContact && cleanContact.length !== 10) {
      setFormError('Please enter a valid 10-digit emergency contact number.');
      return;
    }

    setSubmitting(true);
    try {
      const res: any = await tenantService.createNightOutRequest({
        leaveDate: leaveDateTime.toISOString(),
        returnDate: returnDateTime.toISOString(),
        reason: reason.trim(),
        destinationAddress: destinationAddress.trim() || undefined,
        contactDuringStay: cleanContact ? `+91${cleanContact}` : undefined,
        parentConsentConfirmed,
      });

      setSuccessMsg('Night out intimation submitted to PG management.');
      setShowForm(false);
      setReason('');
      setDestinationAddress('');
      setContactDuringStay('');
      setParentConsentConfirmed(false);

      if (res?.data) {
        setNightOutList((prev) => [res.data, ...prev]);
      } else {
        loadData();
      }

      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      const errText =
        err.response?.data?.message || err.message || 'Failed to submit night out request.';
      setFormError(Array.isArray(errText) ? errText[0] : errText);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = useMemo(() => {
    return nightOutList.filter((item) => {
      const st = (item.status || 'pending').toLowerCase();
      if (statusFilter === 'all') return true;
      return st === statusFilter;
    });
  }, [nightOutList, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: nightOutList.length,
      pending: nightOutList.filter((n) => (n.status || 'pending').toLowerCase() === 'pending').length,
      approved: nightOutList.filter((n) => (n.status || '').toLowerCase() === 'approved').length,
      rejected: nightOutList.filter((n) => (n.status || '').toLowerCase() === 'rejected').length,
    };
  }, [nightOutList]);

  return (
    <div className="space-y-4 pt-1 pb-10 animate-fade-in max-w-3xl mx-auto px-1 sm:px-0">
      {/* Top Navigation */}
      <div className="page-toolbar flex items-center justify-between gap-2">
        <button
          onClick={() => navigate(-1)}
          className="page-back flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brandText tap-target"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setFormError('');
            }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showForm ? 'View Logs' : 'New Night Out'}</span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-5 text-white shadow-lg space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            <Moon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">Night Out Intimation</h2>
            <p className="text-[11px] text-indigo-200/80">
              {propertyDetails?.property?.name || 'PG Management'} · Movement & Safety Register
            </p>
          </div>
        </div>
        <p className="text-xs text-indigo-200/90 leading-relaxed pt-1">
          Log late night stays, weekend departures, and overnight leaves. Automatic notifications are dispatched to PG management for gate permissions.
        </p>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form or List View */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4.5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-brandText">Submit Night Out Request</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          {/* Departure Date & Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              Departure Date & Time <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <NativeDatePicker
                value={leaveDate}
                onChange={setLeaveDate}
                min={todayKolkata}
                placeholder="dd/mm/yyyy"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-medium text-brandText focus-within:border-indigo-600 focus-within:bg-white"
              />
              <div className="relative">
                <input
                  type="time"
                  value={leaveTime}
                  onChange={(e) => setLeaveTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-medium text-brandText focus:border-indigo-600 focus:bg-white focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Expected Return Date & Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              Expected Return Date & Time <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <NativeDatePicker
                value={returnDate}
                onChange={setReturnDate}
                min={leaveDate || todayKolkata}
                placeholder="dd/mm/yyyy"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-medium text-brandText focus-within:border-indigo-600 focus-within:bg-white"
              />
              <div className="relative">
                <input
                  type="time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-medium text-brandText focus:border-indigo-600 focus:bg-white focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700">
                Reason for Night Out <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[10px] tabular-nums font-mono ${reason.length >= 254 ? "text-red-500 font-bold" : "text-gray-400"}`}>
                {reason.length}/254
              </span>
            </div>
            <input
              type="text"
              maxLength={254}
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 254))}
              placeholder="e.g. Visiting home, exam prep, office late shift, family function"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-medium text-brandText focus:border-indigo-600 focus:bg-white focus:outline-none"
              required
            />
          </div>

          {/* Destination Address */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700">
                Destination Address / City (Optional)
              </label>
              <span className={`text-[10px] tabular-nums font-mono ${destinationAddress.length >= 254 ? "text-red-500 font-bold" : "text-gray-400"}`}>
                {destinationAddress.length}/254
              </span>
            </div>
            <input
              type="text"
              maxLength={254}
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value.slice(0, 254))}
              placeholder="e.g. Pune, Flat 402 Green Acres, HSR Layout"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-medium text-brandText focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Emergency Contact */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              Emergency Contact Number (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={contactDuringStay}
                onChange={(e) => setContactDuringStay(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pr-3 pl-11 text-xs font-medium text-brandText focus:border-indigo-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Parent Consent Checkbox */}
          <label className="flex items-start gap-2.5 pt-2 cursor-pointer rounded-xl bg-gray-50/70 p-3 border border-gray-100">
            <input
              type="checkbox"
              checked={parentConsentConfirmed}
              onChange={(e) => setParentConsentConfirmed(e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs text-gray-600 leading-snug">
              I confirm that my parents/guardians are aware and have consented to this overnight leave.
            </span>
          </label>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="w-1/3 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-2/3 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{submitting ? 'Submitting...' : 'Submit Intimation'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* Logs List */
        <div className="space-y-3.5">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-[#008080] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Pending ({counts.pending})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Approved ({counts.approved})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Rejected ({counts.rejected})
            </button>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <ListSkeleton rows={3} />
          ) : error ? (
            <InlineError message={error} onRetry={loadData} />
          ) : filteredList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center space-y-3 shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Moon className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-brandText">
                  {statusFilter === 'all' ? 'No Night Out Requests' : `No ${statusFilter} Requests`}
                </h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  {statusFilter === 'all'
                    ? "You haven't submitted any overnight leave or night out intimation yet."
                    : `No night out requests currently marked as ${statusFilter}.`}
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Submit Night Out Intimation</span>
              </button>
            </div>
          ) : (
            filteredList.map((item) => {
              const status = (item.status || 'pending').toLowerCase();
              const isApproved = status === 'approved';
              const isRejected = status === 'rejected';

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-3 transition-all hover:shadow-md"
                >
                  {/* Top Bar: Reason and Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                        <Moon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brandText line-clamp-1">
                          {item.reason || 'Overnight Leave'}
                        </h4>
                        <span className="text-[10px] text-gray-400">
                          Submitted on {formatDateOnly(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : isRejected
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          : 'bg-[#E6F3F3] text-[#005F5F] border border-[#008080]/30'
                      }`}
                    >
                      {item.status || 'Pending'}
                    </span>
                  </div>

                  {/* Schedule Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <Clock className="h-3 w-3 text-indigo-500" />
                        <span>DEPARTURE</span>
                      </div>
                      <span className="font-bold text-brandText block">
                        {formatDDMMYYYY(item.leaveDate)}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <Clock className="h-3 w-3 text-emerald-500" />
                        <span>EXPECTED RETURN</span>
                      </div>
                      <span className="font-bold text-brandText block">
                        {formatDDMMYYYY(item.returnDate)}
                      </span>
                    </div>
                  </div>

                  {/* Metadata: Destination, Contact, Parent consent */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 pt-0.5">
                    {item.destinationAddress && (
                      <div className="flex items-center gap-1 text-[11px] bg-gray-100 px-2 py-0.5 rounded-lg text-gray-700">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span>{item.destinationAddress}</span>
                      </div>
                    )}

                    {item.contactDuringStay && (
                      <div className="flex items-center gap-1 text-[11px] bg-gray-100 px-2 py-0.5 rounded-lg text-gray-700">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span>{item.contactDuringStay}</span>
                      </div>
                    )}

                    {item.parentConsentConfirmed && (
                      <div className="flex items-center gap-1 text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-medium">
                        <ShieldCheck className="h-3 w-3 text-indigo-600" />
                        <span>Guardian Informed</span>
                      </div>
                    )}
                  </div>

                  {/* Owner Remarks if rejected or approved with instructions */}
                  {item.ownerRemarks && (
                    <div className="rounded-xl border border-[#008080]/30 bg-[#E6F3F3] p-2.5 text-xs text-[#005F5F]">
                      <span className="font-bold">Manager Remarks: </span>
                      <span>{item.ownerRemarks}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
