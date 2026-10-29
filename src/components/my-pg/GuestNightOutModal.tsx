import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Moon,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { tenantService, type GuestRequest, type NightOutRequest } from '../../services/tenantService';

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

  // Guest form
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [relationship, setRelationship] = useState('Friend');
  const [expectedArrival, setExpectedArrival] = useState('');
  const [expectedDeparture, setExpectedDeparture] = useState('');

  // Night-out form
  const [leaveDate, setLeaveDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [reason, setReason] = useState('Visiting hometown / parents');
  const [destinationAddress, setDestinationAddress] = useState('');

  const fetchRecords = () => {
    setLoading(true);
    Promise.all([tenantService.getGuestRequests(), tenantService.getNightOutRequests()])
      .then(([guests, nightOuts]) => {
        setGuestRequests(guests);
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
      setLeaveDate(today);
      setReturnDate(today);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await tenantService.createGuestRequest({
        guestName,
        guestPhone,
        relationship,
        expectedArrival,
        expectedDeparture,
        numberOfGuests: 1,
      });

      setSuccessMsg('Guest request sent to warden/owner for approval.');
      setGuestName('');
      setGuestPhone('');
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
    setSubmitting(true);

    try {
      await tenantService.createNightOutRequest({
        leaveDate,
        returnDate,
        reason,
        destinationAddress,
        parentConsentConfirmed: true,
      });

      setSuccessMsg('Night-out permission request sent for approval.');
      setDestinationAddress('');
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-md max-h-[92dvh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center text-primary font-bold">
              {activeTab === 'guest' ? <Users className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-brandText">
                {activeTab === 'guest' ? 'Overnight Guest Notices' : 'Night-Out Permission'}
              </h2>
              <p className="text-[11px] text-brandText-muted">Visitor & Curfew Pass Tracking</p>
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
            Night-Out Pass
          </button>
        </div>

        {/* Sub-tab Switcher: History vs New */}
        <div className="flex items-center justify-between px-5 pt-3">
          <span className="text-xs font-bold text-brandText">
            {subTab === 'list' ? 'Past & Pending Requests' : 'Create New Request'}
          </span>
          <button
            onClick={() => setSubTab(subTab === 'list' ? 'create' : 'list')}
            className="flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary-100 transition-all"
          >
            {subTab === 'list' ? <Plus className="h-3.5 w-3.5" /> : null}
            {subTab === 'list' ? 'Apply New' : 'View Past'}
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
                  <p className="text-xs font-semibold text-brandText">No Guest Requests</p>
                  <p className="text-[11px] mt-1">Tap 'Apply New' to request visitor entry approval.</p>
                </div>
              ) : (
                guestRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brandText">
                        {req.guestName || 'Overnight Visitor'}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          req.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : req.status === 'rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-brandText-muted">
                      Dates: <strong>{req.expectedArrival}</strong> to <strong>{req.expectedDeparture || req.expectedArrival}</strong>
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. GUEST NOTICE: CREATE FORM */}
          {activeTab === 'guest' && subTab === 'create' && (
            <form onSubmit={handleGuestSubmit} className="space-y-3.5 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-brandText-muted mb-1">
                  Guest Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-brandText-muted mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-muted mb-1">
                    Relationship
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                  >
                    <option value="Friend">Friend</option>
                    <option value="Parent / Guardian">Parent / Guardian</option>
                    <option value="Sibling">Sibling / Family</option>
                    <option value="Colleague">Colleague</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-brandText-muted mb-1">
                    Arrival Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expectedArrival}
                    onChange={(e) => setExpectedArrival(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-muted mb-1">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expectedDeparture}
                    onChange={(e) => setExpectedDeparture(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-xs font-bold text-white shadow-md shadow-primary/25 disabled:opacity-50 hover:bg-primary-dark transition-all tap-target"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Guest Request'}
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
                  <p className="text-xs font-semibold text-brandText">No Night-Out Passes</p>
                  <p className="text-[11px] mt-1">Submit a curfew exemption or leave request before departing.</p>
                </div>
              ) : (
                nightOutRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brandText">{req.reason}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          req.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : req.status === 'rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-brandText-muted">
                      From <strong>{req.leaveDate}</strong> to <strong>{req.returnDate}</strong>
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 4. NIGHT-OUT NOTICE: CREATE FORM */}
          {activeTab === 'nightout' && subTab === 'create' && (
            <form onSubmit={handleNightOutSubmit} className="space-y-3.5 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-brandText-muted mb-1">
                  Reason for Leaving
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Visiting hometown / staying with cousin"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-brandText-muted mb-1">
                    Leave Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-muted mb-1">
                    Return Date
                  </label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brandText-muted mb-1">
                  Destination / Contact Location
                </label>
                <input
                  type="text"
                  placeholder="City or home address during stay"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-brandText focus:border-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 disabled:opacity-50 hover:bg-indigo-700 transition-all tap-target"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request Night-Out Pass'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
