import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Moon,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Calendar,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import {
  tenantService,
  type GuestRequest,
  type NightOutRequest,
} from '../../services/tenantService';

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

interface GuestNightOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'guest' | 'nightout';
}

export const GuestNightOutModal: React.FC<GuestNightOutModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'guest',
}) => {
  const [activeTab, setActiveTab] = useState<'guest' | 'nightout'>(initialTab);
  const [subTab, setSubTab] = useState<'list' | 'create'>('list');

  // Guest list & state
  const [guestRequests, setGuestRequests] = useState<GuestRequest[]>([]);
  const [nightOutRequests, setNightOutRequests] = useState<NightOutRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Multi-Guest form state
  const [guests, setGuests] = useState<IndividualGuestFormItem[]>([
    { name: '', gender: 'Male', phone: '', relationship: 'Friend' },
  ]);
  const [expectedArrival, setExpectedArrival] = useState('');
  const [expectedDeparture, setExpectedDeparture] = useState('');
  const [purpose, setPurpose] = useState('');

  // Night-out form (matches Record Night Out Intimation)
  const [leaveDay, setLeaveDay] = useState(DATE_OPTIONS[0].value);
  const [leaveTime, setLeaveTime] = useState('20:00');
  const [returnDay, setReturnDay] = useState(DATE_OPTIONS[1].value);
  const [returnTime, setReturnTime] = useState('09:00');
  const [reason, setReason] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [contactDuringStay, setContactDuringStay] = useState('');
  const [parentConsentConfirmed, setParentConsentConfirmed] = useState(false);

  const fetchRecords = () => {
    setLoading(true);
    Promise.all([tenantService.getGuestRequests(), tenantService.getNightOutRequests()])
      .then(([guestsData, nightOuts]) => {
        setGuestRequests(guestsData);
        setNightOutRequests(nightOuts);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSubTab('list');
      setError(null);
      setSuccessMsg(null);
      fetchRecords();

      const today = new Date().toISOString().split('T')[0];
      setExpectedArrival(today);
      setExpectedDeparture(today);
      setLeaveDay(DATE_OPTIONS[0].value);
      setLeaveTime('20:00');
      setReturnDay(DATE_OPTIONS[1].value);
      setReturnTime('09:00');
      setGuests([{ name: '', gender: 'Male', phone: '', relationship: 'Friend' }]);
      setPurpose('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

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
    setError(null);

    const validGuests = guests.filter((g) => g.name.trim().length > 0);
    if (validGuests.length === 0) {
      setError('Please enter at least one guest name.');
      return;
    }

    const invalidPhone = validGuests.find((g) => {
      const digits = g.phone.replace(/\D/g, '');
      return digits.length > 0 && digits.length !== 10;
    });
    if (invalidPhone) {
      setError('Please provide a valid 10-digit mobile number for guests.');
      return;
    }

    setSubmitting(true);

    try {
      const primaryGuest = validGuests[0];
      await tenantService.createGuestRequest({
        guestName: primaryGuest.name.trim(),
        guestPhone: primaryGuest.phone ? primaryGuest.phone.replace(/\D/g, '') : undefined,
        guestGender: primaryGuest.gender,
        relationship: primaryGuest.relationship,
        numberOfGuests: validGuests.length,
        guests: validGuests.map((g) => ({
          name: g.name.trim(),
          phone: g.phone ? g.phone.replace(/\D/g, '') : undefined,
          gender: g.gender,
          relationship: g.relationship,
        })),
        expectedArrival,
        expectedDeparture: expectedDeparture || expectedArrival,
        purpose: purpose.trim() || undefined,
      });

      setSuccessMsg('Guest request submitted and shared with PG management.');
      setGuests([{ name: '', gender: 'Male', phone: '', relationship: 'Friend' }]);
      setPurpose('');
      setTimeout(() => {
        setSuccessMsg(null);
        setSubTab('list');
        fetchRecords();
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit guest request.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNightOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const leaveAt = combineWhen(leaveDay, leaveTime);
    const returnAt = combineWhen(returnDay, returnTime);

    if (!leaveAt || !returnAt) {
      setError('Please select valid departure and return date & time.');
      return;
    }

    if (returnAt <= leaveAt) {
      setError('Expected return date and time must be after departure.');
      return;
    }

    if (!reason.trim()) {
      setError('Please enter the reason for leaving.');
      return;
    }

    if (contactDuringStay.trim() && contactDuringStay.trim().length !== 10) {
      setError('Please enter a valid 10-digit emergency contact number.');
      return;
    }

    setSubmitting(true);

    try {
      await tenantService.createNightOutRequest({
        leaveDate: leaveAt.toISOString(),
        returnDate: returnAt.toISOString(),
        reason: reason.trim(),
        destinationAddress: destinationAddress.trim() || undefined,
        contactDuringStay: contactDuringStay.trim() || undefined,
        parentConsentConfirmed: parentConsentConfirmed,
      });

      setSuccessMsg('Night-out intimation submitted to PG management.');
      setReason('');
      setDestinationAddress('');
      setContactDuringStay('');
      setParentConsentConfirmed(false);
      setTimeout(() => {
        setSuccessMsg(null);
        setSubTab('list');
        fetchRecords();
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit night-out request.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const validGuestCount = guests.filter((g) => g.name.trim().length > 0).length || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-lg max-h-[92dvh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center text-primary font-bold">
              {activeTab === 'guest' ? <Users className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-brandText">
                {activeTab === 'guest' ? 'Visitor & Guest Pass' : 'Night-Out Intimation'}
              </h2>
              <p className="text-[11px] text-brandText-muted">
                {activeTab === 'guest'
                  ? 'Log visitor arrival and provide individual guest details.'
                  : 'Inform management about upcoming stay away from PG.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-brandText-muted hover:text-brandText tap-target"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Top Type Switcher (Guest vs Night-Out) */}
        <div className="grid grid-cols-2 gap-2 border-b border-gray-100 bg-gray-50/70 p-2">
          <button
            onClick={() => {
              setActiveTab('guest');
              setSubTab('list');
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              activeTab === 'guest'
                ? 'bg-white text-primary shadow-sm'
                : 'text-brandText-muted hover:text-brandText'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Guest Entry
          </button>

          <button
            onClick={() => {
              setActiveTab('nightout');
              setSubTab('list');
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              activeTab === 'nightout'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-brandText-muted hover:text-brandText'
            }`}
          >
            <Moon className="h-3.5 w-3.5 text-indigo-600" />
            Night-Out Intimation
          </button>
        </div>

        {/* Sub-tab Switcher: History vs New */}
        <div className="flex items-center justify-between px-5 pt-3">
          <span className="text-xs font-bold text-brandText">
            {subTab === 'list' ? 'Past Records' : 'Create Request'}
          </span>
          <button
            onClick={() => setSubTab(subTab === 'list' ? 'create' : 'list')}
            className="flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary-100 transition-all"
          >
            {subTab === 'list' ? <Plus className="h-3.5 w-3.5" /> : null}
            {subTab === 'list' ? 'Add New' : 'View Past'}
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
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

          {/* 1. GUEST NOTICE: LIST */}
          {activeTab === 'guest' && subTab === 'list' && (
            <div className="space-y-2.5 animate-fade-in">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : guestRequests.length === 0 ? (
                <div className="py-10 text-center text-brandText-muted">
                  <Users className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs font-semibold text-brandText">No Guest Entries</p>
                  <p className="text-[11px] mt-1">Tap 'Add New' to submit guest entry intimation.</p>
                </div>
              ) : (
                guestRequests.map((req) => {
                  const guestCount = req.numberOfGuests || (req.guests?.length ? req.guests.length : 1);
                  return (
                    <div
                      key={req.id}
                      className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brandText">
                            {req.guestName || 'Guest Visitor'}
                          </span>
                          {guestCount > 1 && (
                            <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 border border-teal-100">
                              +{guestCount - 1} more ({guestCount} total)
                            </span>
                          )}
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            req.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-teal-50 text-teal-700'
                          }`}
                        >
                          {req.status === 'approved' ? 'ACKNOWLEDGED' : 'INFORMED'}
                        </span>
                      </div>

                      {req.guests && req.guests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {req.guests.map((g, idx) => (
                            <span
                              key={idx}
                              className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700"
                            >
                              {g.name} {g.gender ? `(${g.gender})` : ''} {g.relationship ? `· ${g.relationship}` : ''}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-brandText-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          Arrival: <strong className="text-gray-700">{req.expectedArrival}</strong>
                        </span>
                        {req.expectedDeparture && req.expectedDeparture !== req.expectedArrival && (
                          <span>
                            Dep: <strong className="text-gray-700">{req.expectedDeparture}</strong>
                          </span>
                        )}
                      </div>

                      {req.purpose && (
                        <p className="text-[11px] text-gray-600 bg-gray-50/70 rounded-lg p-2 border border-gray-100">
                          <span className="font-semibold text-gray-700">Purpose: </span>
                          {req.purpose}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 2. GUEST NOTICE: CREATE FORM (MATCHING THE OWNER PANEL MODAL) */}
          {activeTab === 'guest' && subTab === 'create' && (
            <form onSubmit={handleGuestSubmit} className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                  <Users className="h-4 w-4 text-primary" />
                  <span>
                    Guest Details ({guests.length} Guest{guests.length > 1 ? 's' : ''})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddGuestItem}
                  className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-all"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Another Guest</span>
                </button>
              </div>

              {/* Guest cards */}
              <div className="space-y-3">
                {guests.map((guest, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-2xl border border-gray-200 bg-gray-50/50 p-3.5 space-y-3 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-900">
                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-teal-700 text-[9px] text-white">
                          {idx + 1}
                        </span>
                        {idx === 0 ? 'Primary Guest' : `Guest #${idx + 1}`}
                      </span>

                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGuestItem(idx)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul Sharma"
                          value={guest.name}
                          onChange={(e) => handleGuestItemChange(idx, 'name', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Gender *
                        </label>
                        <select
                          value={guest.gender}
                          onChange={(e) =>
                            handleGuestItemChange(
                              idx,
                              'gender',
                              e.target.value as 'Male' | 'Female' | 'Other',
                            )
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          placeholder="10-digit number"
                          value={guest.phone}
                          onChange={(e) => handleGuestItemChange(idx, 'phone', e.target.value)}
                          maxLength={10}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Relationship to Tenant
                        </label>
                        <select
                          value={guest.relationship}
                          onChange={(e) =>
                            handleGuestItemChange(idx, 'relationship', e.target.value)
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                        >
                          <option value="Friend">Friend</option>
                          <option value="Parent / Guardian">Parent / Guardian</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Family Relative">Family Relative</option>
                          <option value="Colleague">Colleague / Workmate</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shared Schedule */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Expected Arrival *
                  </label>
                  <input
                    type="date"
                    required
                    value={expectedArrival}
                    onChange={(e) => setExpectedArrival(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Expected Departure
                  </label>
                  <input
                    type="date"
                    value={expectedDeparture}
                    onChange={(e) => setExpectedDeparture(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Purpose of Visit
                </label>
                <textarea
                  rows={2}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Enter reason for visit or special instructions..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-white shadow-md shadow-primary/25 disabled:opacity-50 hover:bg-primary-dark transition-all tap-target"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Save Guest Log (${validGuestCount})`
                )}
              </button>
            </form>
          )}

          {/* 3. NIGHT-OUT NOTICE: LIST */}
          {activeTab === 'nightout' && subTab === 'list' && (
            <div className="space-y-2.5 animate-fade-in">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : nightOutRequests.length === 0 ? (
                <div className="py-10 text-center text-brandText-muted">
                  <Moon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs font-semibold text-brandText">No Night-Out Intimations</p>
                  <p className="text-[11px] mt-1">Submit a night-out notice to inform PG management before departing.</p>
                </div>
              ) : (
                nightOutRequests.map((req: any) => (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-brandText block">{req.reason}</span>
                        {req.destinationAddress && (
                          <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                            <span>{req.destinationAddress}</span>
                          </span>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${
                          req.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-teal-50 text-teal-700'
                        }`}
                      >
                        {req.status === 'approved' ? 'ACKNOWLEDGED' : 'INFORMED'}
                      </span>
                    </div>

                    {(req.contactDuringStay || req.parentConsentConfirmed) && (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px]">
                        {req.contactDuringStay && (
                          <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">
                            <Phone className="h-2.5 w-2.5 text-gray-400" />
                            <span>{req.contactDuringStay}</span>
                          </span>
                        )}
                        {req.parentConsentConfirmed && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg font-medium">
                            <ShieldCheck className="h-2.5 w-2.5 text-emerald-600" />
                            <span>Parent Informed</span>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-2 text-[11px] text-gray-600">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Departure:</span>
                        <span className="font-semibold text-brandText">
                          {new Date(req.leaveDate).toLocaleString('en-IN', {
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
                          {new Date(req.returnDate).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 4. NIGHT-OUT NOTICE: CREATE FORM (Record Night Out Intimation) */}
          {activeTab === 'nightout' && subTab === 'create' && (
            <form onSubmit={handleNightOutSubmit} className="space-y-3.5 animate-fade-in">
              {/* Departure Date & Time */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-brandText-muted">
                  Departure Date & Time <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={leaveDay}
                    onChange={(e) => setLeaveDay(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
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
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
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
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-brandText-muted">
                  Expected Return Date & Time <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={returnDay}
                    onChange={(e) => setReturnDay(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
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
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
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
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-brandText-muted">
                  Destination / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Home, Hometown, Relative's place"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                />
              </div>

              {/* Emergency Contact Number During Stay */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-brandText-muted">
                  Emergency Contact Number During Stay
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={contactDuringStay}
                  onChange={(e) => setContactDuringStay(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                />
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-brandText-muted">
                  Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Reason for night out (e.g. Visiting home, exam, office work)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                />
              </div>

              {/* Parent / Guardian Informed Checkbox Card */}
              <div className="rounded-2xl border border-gray-200/80 bg-gray-50/70 p-3.5 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="modal-parent-informed"
                  checked={parentConsentConfirmed}
                  onChange={(e) => setParentConsentConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label
                  htmlFor="modal-parent-informed"
                  className="text-xs select-none cursor-pointer space-y-0.5"
                >
                  <span className="font-bold text-brandText block">Parent / Guardian Informed</span>
                  <span className="text-[11px] text-gray-500 block leading-tight">
                    Check this if the resident has informed their parents/guardians about this night out.
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSubTab('list')}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 py-3 text-xs font-bold text-white shadow-md shadow-teal-600/25 disabled:opacity-50 transition-all tap-target"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{submitting ? 'Saving...' : 'Save Night Out Entry'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
