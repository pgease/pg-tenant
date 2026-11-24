import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Phone,
  ShieldCheck,
  Calendar,
  Loader2,
  User,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  tenantService,
  type GuestRequest,
  type IndividualGuestItem,
} from '../services/tenantService';
import { useAuth } from '../context/AuthContext';
import { ListSkeleton } from '../components/ui/ListSkeleton';
import { InlineError } from '../components/ui/InlineError';
import { NativeDatePicker } from '../components/common/NativeDatePicker';
import {
  formatDateTimeToDDMMYYYY,
  getKolkataTodayYYYYMMDD,
} from '../utils/dateUtils';

function formatDDMMYYYY(dateVal: string | Date | null | undefined): string {
  return formatDateTimeToDDMMYYYY(dateVal);
}


export const GuestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLinkedTenant, propertyDetails } = useAuth();

  const [guestList, setGuestList] = useState<GuestRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Drawer / Modal State
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');

  // Form Fields (Asia/Kolkata timezone default)
  const todayKolkata = getKolkataTodayYYYYMMDD(0);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestGender, setGuestGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [relationship, setRelationship] = useState('Friend');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [arrivalDate, setArrivalDate] = useState(todayKolkata);
  const [arrivalTime, setArrivalTime] = useState('18:00');
  const [departureDate, setDepartureDate] = useState(todayKolkata);
  const [departureTime, setDepartureTime] = useState('21:00');
  const [purpose, setPurpose] = useState('Personal visit');

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
      const data = await tenantService.getGuestRequests();
      setGuestList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load guest requests:', err);
      setError('Could not load guest requests. Please try again.');
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

    if (!guestName.trim()) {
      setFormError('Please enter the primary guest name.');
      return;
    }

    const cleanPhone = guestPhone.replace(/\D/g, '');
    if (cleanPhone && cleanPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!arrivalDate || !arrivalTime) {
      setFormError('Please specify the expected arrival date and time.');
      return;
    }

    const arrivalDateTime = new Date(`${arrivalDate}T${arrivalTime}:00`);
    if (isNaN(arrivalDateTime.getTime())) {
      setFormError('Invalid arrival date and time.');
      return;
    }

    let departureDateTime: Date | undefined;
    if (departureDate && departureTime) {
      departureDateTime = new Date(`${departureDate}T${departureTime}:00`);
      if (!isNaN(departureDateTime.getTime()) && departureDateTime <= arrivalDateTime) {
        setFormError('Departure time must be after arrival time.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const guestItems: IndividualGuestItem[] = [
        {
          name: guestName.trim(),
          phone: cleanPhone ? `+91${cleanPhone}` : undefined,
          gender: guestGender,
          relationship: relationship.trim(),
        },
      ];

      const res = await tenantService.createGuestRequest({
        guestName: guestName.trim(),
        guestPhone: cleanPhone ? `+91${cleanPhone}` : undefined,
        guestGender,
        relationship: relationship.trim(),
        numberOfGuests: Number(numberOfGuests) || 1,
        guests: guestItems,
        expectedArrival: arrivalDateTime.toISOString(),
        expectedDeparture: departureDateTime ? departureDateTime.toISOString() : undefined,
        purpose: purpose.trim() || 'Visit',
      });

      setSuccessMsg(`Guest pass request for ${guestName.trim()} submitted to PG Owner.`);
      setShowForm(false);
      setGuestName('');
      setGuestPhone('');
      setPurpose('Personal visit');
      setNumberOfGuests(1);

      if (res?.id) {
        setGuestList((prev) => [res, ...prev]);
      } else {
        loadData();
      }

      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      const errText =
        err.response?.data?.message || err.message || 'Failed to submit guest request.';
      setFormError(Array.isArray(errText) ? errText[0] : errText);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGuests = useMemo(() => {
    return guestList.filter((g) => {
      const st = (g.status || 'pending').toLowerCase();
      if (statusFilter === 'all') return true;
      return st === statusFilter;
    });
  }, [guestList, statusFilter]);

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    guestList.forEach((g) => {
      const st = (g.status || 'pending').toLowerCase();
      if (st === 'pending') pending++;
      else if (st === 'approved') approved++;
      else if (st === 'rejected') rejected++;
    });
    return { all: guestList.length, pending, approved, rejected };
  }, [guestList]);

  return (
    <div className="space-y-4 pt-1 pb-6 animate-fade-in">
      {/* Top Navigation & Toolbar */}
      <div className="page-toolbar flex flex-wrap items-center justify-between gap-2">
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
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-dark active:scale-95 transition-all tap-target"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showForm ? 'Close Form' : 'New Guest Pass'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2.5 animate-slide-up shadow-xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tenancy & Information Banner */}
      <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-white p-4 shadow-sm flex items-center justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Visitor Management
          </span>
          <h2 className="text-base sm:text-lg font-bold text-brandText mt-0.5 break-words">
            Guest Passes & Visitor Log
          </h2>
          <p className="text-xs text-teal-800 font-medium mt-0.5 break-words">
            {propertyDetails?.property?.name || 'Verified PG Residence'}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100/60 text-primary">
          <Users className="h-6 w-6" />
        </div>
      </div>

      {/* Request Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-teal-100 bg-white p-4 sm:p-5 shadow-sm space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-brandText flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Request Visitor Pass
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Notifies your PG manager on WhatsApp immediately for instant gate entry.
              </p>
            </div>
          </div>

          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Guest Name *</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-xs text-brandText focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Mobile Number (10 digits)</label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                maxLength={10}
                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-xs text-brandText focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Relationship</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-xs text-brandText focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                <option value="Friend">Friend</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Relative">Relative</option>
                <option value="Colleague">Colleague</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Gender</label>
              <select
                value={guestGender}
                onChange={(e) => setGuestGender(e.target.value as any)}
                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-xs text-brandText focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Total Visitors</label>
              <input
                type="number"
                min={1}
                max={10}
                value={numberOfGuests}
                onChange={(e) => setNumberOfGuests(Number(e.target.value) || 1)}
                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-xs text-brandText focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Purpose of Visit</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Study, Family visit, Weekend stay"
                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-xs text-brandText focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Expected Arrival Date *</label>
              <NativeDatePicker
                value={arrivalDate}
                onChange={setArrivalDate}
                min={todayKolkata}
                placeholder="dd/mm/yyyy"
                required
                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-xs text-brandText focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Arrival Time *</label>
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                required
                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-xs text-brandText focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Expected Departure Date</label>
              <NativeDatePicker
                value={departureDate}
                onChange={setDepartureDate}
                min={arrivalDate || todayKolkata}
                placeholder="dd/mm/yyyy"
                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-xs text-brandText focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Departure Time</label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-xs text-brandText focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary-dark active:scale-95 transition-all disabled:opacity-50 tap-target"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Submit Guest Pass</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
            statusFilter === 'all'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
            statusFilter === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          Under Review ({counts.pending})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('approved')}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
            statusFilter === 'approved'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          Approved ({counts.approved})
        </button>
        {counts.rejected > 0 && (
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Rejected ({counts.rejected})
          </button>
        )}
      </div>

      {/* Guest Passes List */}
      <div className="space-y-3">
        {error ? (
          <InlineError message={error} onRetry={loadData} />
        ) : loading ? (
          <ListSkeleton rows={3} />
        ) : filteredGuests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-brandText">
              {guestList.length === 0 ? 'No Guest Passes Yet' : 'No Guest Passes Match Filter'}
            </h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              {guestList.length === 0
                ? isLinkedTenant
                  ? 'Planning to have friends or family visit? Register a guest pass in advance for smooth gate entry.'
                  : 'Sign in with your linked PG account to issue guest entry passes.'
                : 'Try selecting a different status filter to view requests.'}
            </p>
            {guestList.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary-dark active:scale-95 transition-all tap-target"
              >
                <Plus className="h-4 w-4" /> Request Guest Pass
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <Filter className="h-3 w-3" /> Clear Filter
              </button>
            )}
          </div>
        ) : (
          filteredGuests.map((req) => {
            const st = (req.status || 'pending').toLowerCase();
            const isApproved = st === 'approved';
            const isPending = st === 'pending';
            const isRejected = st === 'rejected';

            const badgeConfig = isApproved
              ? { label: 'Approved', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
              : isPending
              ? { label: 'Under Review', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' }
              : isRejected
              ? { label: 'Rejected', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' }
              : { label: st, badgeClass: 'bg-gray-100 text-gray-700 border-gray-200' };

            const guestItems = Array.isArray(req.guests) && req.guests.length > 0 ? req.guests : [];
            const primaryName = req.guestName || (guestItems[0]?.name) || 'Guest Visitor';
            const primaryPhone = req.guestPhone || guestItems[0]?.phone;

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3 transition-all hover:border-teal-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-600'
                          : isPending
                          ? 'bg-amber-50 text-amber-600'
                          : isRejected
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isPending ? (
                        <Clock className="h-5 w-5" />
                      ) : isRejected ? (
                        <XCircle className="h-5 w-5" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-brandText truncate">
                          {primaryName}
                        </h4>
                        {req.relationship && (
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                            {req.relationship}
                          </span>
                        )}
                        {Number(req.numberOfGuests) > 1 && (
                          <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
                            +{Number(req.numberOfGuests) - 1} more
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                        {primaryPhone ? (
                          <>
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{primaryPhone}</span>
                            <span className="text-gray-300">•</span>
                          </>
                        ) : null}
                        <span>{req.purpose || 'Personal visit'}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeConfig.badgeClass}`}
                  >
                    {badgeConfig.label}
                  </span>
                </div>

                {/* Visit Timeline Info */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-2.5 text-xs text-gray-700 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>Arrival: <strong>{formatDDMMYYYY(req.expectedArrival)}</strong></span>
                  </div>
                  {req.expectedDeparture && (
                    <div className="text-[11px] text-gray-500">
                      Departure: <strong>{formatDDMMYYYY(req.expectedDeparture)}</strong>
                    </div>
                  )}
                </div>

                {/* Owner remarks if rejected or commented */}
                {req.ownerRemarks && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900">
                    <span className="font-bold">Manager Remarks: </span>
                    <span>{req.ownerRemarks}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
