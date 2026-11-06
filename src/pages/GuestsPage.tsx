import React, { useState, useEffect } from 'react';
import {
  Users,
  Moon,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Trash2,
  Calendar,
  UserCheck,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  tenantService,
  type GuestRequest,
  type NightOutRequest,
  type IndividualGuestItem,
} from '../services/tenantService';
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
  const date = new Date(`${day}T${time}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

interface IndividualGuestFormItem {
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  relationship: string;
}

export const GuestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLinkedTenant, propertyDetails } = useAuth();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'guests' | 'nightout'>(() =>
    tabParam === 'nightout' ? 'nightout' : 'guests',
  );

  useEffect(() => {
    if (tabParam === 'nightout') {
      setActiveTab('nightout');
    } else if (tabParam === 'guests') {
      setActiveTab('guests');
    }
  }, [tabParam]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lists
  const [guestList, setGuestList] = useState<GuestRequest[]>([]);
  const [nightOutList, setNightOutList] = useState<NightOutRequest[]>([]);

  // Guest Form State (supports multiple individual guests)
  const [guests, setGuests] = useState<IndividualGuestFormItem[]>([
    { name: '', gender: 'Male', phone: '', relationship: 'Friend' },
  ]);
  const [arrivalDate, setArrivalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [departureDate, setDepartureDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');

  // Night Out Form State (matches owner app Record Night Out Intimation)
  const [leaveDay, setLeaveDay] = useState(DATE_OPTIONS[0].value);
  const [leaveTime, setLeaveTime] = useState('20:00');
  const [returnDay, setReturnDay] = useState(DATE_OPTIONS[1].value);
  const [returnTime, setReturnTime] = useState('09:00');
  const [destination, setDestination] = useState('');
  const [stayContact, setStayContact] = useState('');
  const [reason, setReason] = useState('');
  const [parentConsentConfirmed, setParentConsentConfirmed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const [guestsData, nightouts] = await Promise.all([
          tenantService.getGuestRequests().catch(() => []),
          tenantService.getNightOutRequests().catch(() => []),
        ]);
        setGuestList(guestsData);
        setNightOutList(nightouts);
      }
    } catch (e) {
      console.error('Error loading guest data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const handleAddGuestItem = () => {
    setGuests((prev) => [
      ...prev,
      { name: '', gender: 'Male', phone: '', relationship: 'Friend' },
    ]);
  };

  const handleRemoveGuestItem = (index: number) => {
    if (guests.length <= 1) return;
    setGuests((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleGuestItemChange = (
    index: number,
    field: keyof IndividualGuestFormItem,
    val: string,
  ) => {
    setGuests((prev) =>
      prev.map((g, idx) => (idx === index ? { ...g, [field]: val } : g)),
    );
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const validGuests = guests.filter((g) => g.name.trim().length > 0);
    if (validGuests.length === 0) {
      setErrorMsg('Please enter at least one guest name.');
      return;
    }

    const invalidPhone = validGuests.find((g) => {
      const digits = g.phone.replace(/\D/g, '');
      return digits.length > 0 && digits.length !== 10;
    });
    if (invalidPhone) {
      setErrorMsg('Please provide a valid 10-digit mobile number for guests.');
      return;
    }

    if (!arrivalDate) {
      setErrorMsg('Please specify the expected arrival date.');
      return;
    }

    setSubmitting(true);
    try {
      const primary = validGuests[0];
      const guestsPayload: IndividualGuestItem[] = validGuests.map((g) => ({
        name: g.name.trim(),
        phone: g.phone.trim() || undefined,
        gender: g.gender,
        relationship: g.relationship.trim() || undefined,
      }));

      const created = await tenantService.createGuestRequest({
        guestName: primary.name.trim(),
        guestPhone: primary.phone.trim() || undefined,
        guestGender: primary.gender || undefined,
        relationship: primary.relationship.trim() || undefined,
        numberOfGuests: validGuests.length,
        guests: guestsPayload,
        expectedArrival: new Date(arrivalDate).toISOString(),
        expectedDeparture: departureDate ? new Date(departureDate).toISOString() : undefined,
        purpose: purpose.trim() || undefined,
      });

      setMsg(`Guest entry for ${validGuests.length} visitor(s) registered successfully!`);
      setGuests([{ name: '', gender: 'Male', phone: '', relationship: 'Friend' }]);
      setPurpose('');
      setShowForm(false);
      if (created) {
        setGuestList((prev) => [created, ...prev]);
      }
      loadData();
      setTimeout(() => setMsg(''), 4500);
    } catch (err: any) {
      const errText =
        err.response?.data?.message || err.message || 'Failed to submit guest request.';
      setErrorMsg(Array.isArray(errText) ? errText[0] : errText);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNightOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const leaveAt = combineWhen(leaveDay, leaveTime);
    const returnAt = combineWhen(returnDay, returnTime);

    if (!leaveAt || !returnAt) {
      setErrorMsg('Please select valid departure and return date & time.');
      return;
    }

    if (returnAt <= leaveAt) {
      setErrorMsg('Expected return date and time must be after departure.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Please enter the reason for leaving.');
      return;
    }

    if (stayContact.trim() && stayContact.trim().length !== 10) {
      setErrorMsg('Please enter a valid 10-digit emergency contact number.');
      return;
    }

    setSubmitting(true);
    try {
      await tenantService.createNightOutRequest({
        leaveDate: leaveAt.toISOString(),
        returnDate: returnAt.toISOString(),
        reason: reason.trim(),
        destinationAddress: destination.trim() || undefined,
        contactDuringStay: stayContact.trim() || undefined,
        parentConsentConfirmed: parentConsentConfirmed,
      });
      setMsg('Night out intimation submitted successfully! PG management has been informed.');
      setReason('');
      setDestination('');
      setStayContact('');
      setParentConsentConfirmed(false);
      setShowForm(false);
      loadData();
      setTimeout(() => setMsg(''), 4500);
    } catch (err: any) {
      const errText =
        err.response?.data?.message || err.message || 'Failed to submit night out intimation.';
      setErrorMsg(Array.isArray(errText) ? errText[0] : errText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-1 pb-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brandText tap-target"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setErrorMsg('');
            }}
            className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-primary-dark active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showForm ? 'View Logs' : activeTab === 'guests' ? 'Add Guest Log' : 'New Night Out'}</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 flex items-center gap-2 animate-fade-in">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="grid grid-cols-2 rounded-2xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab('guests');
            setShowForm(false);
            setErrorMsg('');
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            activeTab === 'guests'
              ? 'bg-white text-brandText shadow-sm'
              : 'text-gray-500 hover:text-brandText'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Guest Entry Logs</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('nightout');
            setShowForm(false);
            setErrorMsg('');
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            activeTab === 'nightout'
              ? 'bg-white text-brandText shadow-sm'
              : 'text-gray-500 hover:text-brandText'
          }`}
        >
          <Moon className="h-4 w-4" />
          <span>Night Out Intimation</span>
        </button>
      </div>

      {/* Form or Feed */}
      {showForm ? (
        activeTab === 'guests' ? (
          /* MULTI-GUEST REGISTRATION FORM */
          <form
            onSubmit={handleGuestSubmit}
            className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm space-y-4 animate-fade-in"
          >
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-brandText flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Add Guest Log
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Log visitor arrival and provide individual details for each guest.
                </p>
              </div>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                {propertyDetails?.property?.name || 'Resident Room'}
              </span>
            </div>

            {/* Guest Details Section with Add Another Guest */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  Guest Details ({guests.length} Guest{guests.length > 1 ? 's' : ''})
                </span>
                <button
                  type="button"
                  onClick={handleAddGuestItem}
                  className="flex items-center gap-1 rounded-xl border border-primary/40 bg-teal-50/50 px-2.5 py-1 text-xs font-bold text-primary hover:bg-teal-50 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Another Guest</span>
                </button>
              </div>

              {/* Guest cards */}
              {guests.map((g, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3.5 space-y-3 relative"
                >
                  <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
                    <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                      <span className="h-5 w-5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-black inline-flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {idx === 0 ? 'Primary Guest' : `Guest #${idx + 1}`}
                    </span>

                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGuestItem(idx)}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={g.name}
                        onChange={(e) => handleGuestItemChange(idx, 'name', e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                        required={idx === 0}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Gender <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={g.gender}
                        onChange={(e) =>
                          handleGuestItemChange(idx, 'gender', e.target.value as any)
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={g.phone}
                        onChange={(e) => handleGuestItemChange(idx, 'phone', e.target.value)}
                        placeholder="10-digit number"
                        maxLength={10}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Relationship to Tenant
                      </label>
                      <input
                        type="text"
                        value={g.relationship}
                        onChange={(e) =>
                          handleGuestItemChange(idx, 'relationship', e.target.value)
                        }
                        placeholder="e.g. Friend, Parent, Sibling"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Expected Arrival & Departure Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Expected Arrival <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Expected Departure
                </label>
                <input
                  type="date"
                  min={arrivalDate || undefined}
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Purpose of Visit
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Enter reason for visit or special instructions..."
                rows={2}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>
                  {submitting
                    ? 'Saving Log...'
                    : `Save Guest Log (${guests.filter((g) => g.name.trim()).length || 1})`}
                </span>
              </button>
            </div>
          </form>
        ) : (
          /* NIGHT OUT INTIMATION FORM (Identical to Owner App Record Night Out Intimation) */
          <form
            onSubmit={handleNightOutSubmit}
            className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm space-y-4 animate-fade-in"
          >
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <Moon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brandText">Record Night Out Intimation</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Log your night out entry and timings for PG management.
                </p>
              </div>
            </div>

            {/* Departure Date & Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Departure Date & Time <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={leaveDay}
                  onChange={(e) => setLeaveDay(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                  required
                >
                  {DATE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={leaveTime}
                  onChange={(e) => setLeaveTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                  required
                >
                  {TIME_OPTIONS.map((opt) => (
                    <option key={`leave-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expected Return Date & Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Expected Return Date & Time <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={returnDay}
                  onChange={(e) => setReturnDay(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                  required
                >
                  {DATE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                  required
                >
                  {TIME_OPTIONS.map((opt) => (
                    <option key={`return-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Destination / Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Destination / Location
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Home, Hometown, Relative's place"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
              />
            </div>

            {/* Emergency Contact Number During Stay */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Emergency Contact Number During Stay
              </label>
              <input
                type="tel"
                value={stayContact}
                onChange={(e) => setStayContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                maxLength={10}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
              />
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for night out (e.g. Visiting home, exam, office work)"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                required
              />
            </div>

            {/* Parent / Guardian Informed Checkbox Card */}
            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/70 p-3.5 flex items-start gap-3">
              <input
                type="checkbox"
                id="tenant-parent-informed"
                checked={parentConsentConfirmed}
                onChange={(e) => setParentConsentConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <label
                htmlFor="tenant-parent-informed"
                className="text-xs select-none cursor-pointer space-y-0.5"
              >
                <span className="font-bold text-brandText block">Parent / Guardian Informed</span>
                <span className="text-[11px] text-gray-500 block leading-tight">
                  Check this if the resident has informed their parents/guardians about this night out.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-50 transition-colors"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{submitting ? 'Saving...' : 'Save Night Out Entry'}</span>
              </button>
            </div>
          </form>
        )
      ) : (
        /* Requests History Feed */
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
              <p className="text-xs font-medium text-gray-500">Loading requests...</p>
            </div>
          ) : activeTab === 'guests' ? (
            guestList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-brandText">No Guest Entries</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  {isLinkedTenant
                    ? 'No visitor entries recorded for your room. Tap Add Guest Log to register an upcoming visitor.'
                    : 'Sign in to an active PG stay to register guests.'}
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark"
                >
                  Add Guest Log
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {guestList.map((item) => {
                  const hasMulti = Array.isArray(item.guests) && item.guests.length > 0;
                  const totalCount = hasMulti ? item.guests!.length : item.numberOfGuests || 1;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-brandText">
                              {item.guestName || 'Visitor'}
                            </h4>
                            {totalCount > 1 && (
                              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-100">
                                {totalCount} Guests
                              </span>
                            )}
                          </div>
                          {item.guestPhone && (
                            <p className="text-[11px] text-gray-500 mt-0.5">{item.guestPhone}</p>
                          )}
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            item.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-teal-50 text-teal-700'
                          }`}
                        >
                          {item.status === 'approved' ? 'ACKNOWLEDGED' : 'INFORMED'}
                        </span>
                      </div>

                      {/* Multiple individual guests breakdown if available */}
                      {hasMulti && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {item.guests!.map((g, gIdx) => (
                            <span
                              key={gIdx}
                              className="inline-flex items-center gap-1 rounded-lg bg-gray-50 border border-gray-200/70 px-2 py-0.5 text-[11px] font-medium text-gray-700"
                            >
                              <span className="h-4 w-4 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold inline-flex items-center justify-center">
                                {gIdx + 1}
                              </span>
                              <span>{g.name}</span>
                              {g.gender && <span className="text-gray-400">({g.gender})</span>}
                              {g.relationship && (
                                <span className="text-gray-400">· {g.relationship}</span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 border-t border-gray-50 pt-2">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          Arrival:{' '}
                          {new Date(item.expectedArrival).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        {item.expectedDeparture && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            Departure:{' '}
                            {new Date(item.expectedDeparture).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        )}
                        {item.purpose && (
                          <span className="text-[11px] text-gray-500 w-full pt-0.5 italic">
                            Purpose: "{item.purpose}"
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : nightOutList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Moon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-brandText">No Night Out Intimations</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                {isLinkedTenant
                  ? 'No night out intimations recorded. Tap New Night Out to inform PG management.'
                  : 'Sign in to an active PG stay to submit night out intimations.'}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark"
              >
                Inform Night Out
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {nightOutList.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-brandText">{item.reason}</h4>
                      {item.destinationAddress && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                          <span>{item.destinationAddress}</span>
                        </p>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${
                        item.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-teal-50 text-teal-700'
                      }`}
                    >
                      {item.status === 'approved' ? 'ACKNOWLEDGED' : 'INFORMED'}
                    </span>
                  </div>

                  {/* Extra Meta: Contact & Parent Consent */}
                  {(item.contactDuringStay || item.parentConsentConfirmed) && (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                      {item.contactDuringStay && (
                        <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>Stay Contact: {item.contactDuringStay}</span>
                        </span>
                      )}
                      {item.parentConsentConfirmed && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg font-medium">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          <span>Parent / Guardian Informed</span>
                        </span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-2 text-[11px] text-gray-600">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Departure:</span>
                      <span className="font-semibold text-brandText">
                        {new Date(item.leaveDate).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Return:</span>
                      <span className="font-semibold text-brandText">
                        {new Date(item.returnDate).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
