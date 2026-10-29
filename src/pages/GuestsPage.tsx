import React, { useState, useEffect } from 'react';
import {
  Users,
  Moon,
  Plus,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenantService, type GuestRequest, type NightOutRequest } from '../services/tenantService';
import { useAuth } from '../context/AuthContext';

export const GuestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLinkedTenant } = useAuth();

  const [activeTab, setActiveTab] = useState<'guests' | 'nightout'>('guests');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lists
  const [guestList, setGuestList] = useState<GuestRequest[]>([]);
  const [nightOutList, setNightOutList] = useState<NightOutRequest[]>([]);

  // Guest Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [purpose, setPurpose] = useState('');

  // Night Out Form State
  const [leaveDate, setLeaveDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const [guests, nightouts] = await Promise.all([
          tenantService.getGuestRequests().catch(() => []),
          tenantService.getNightOutRequests().catch(() => []),
        ]);
        setGuestList(guests);
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

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !arrivalDate) {
      alert('Please fill guest name and expected arrival time.');
      return;
    }

    setSubmitting(true);
    try {
      await tenantService.createGuestRequest({
        guestName,
        guestPhone,
        expectedArrival: arrivalDate,
        expectedDeparture: departureDate || undefined,
        numberOfGuests: Number(numberOfGuests) || 1,
        purpose,
      });
      setMsg('Guest request submitted successfully!');
      setGuestName('');
      setGuestPhone('');
      setArrivalDate('');
      setDepartureDate('');
      setPurpose('');
      setShowForm(false);
      loadData();
      setTimeout(() => setMsg(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit guest request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNightOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveDate || !returnDate || !reason) {
      alert('Please enter departure date, return date, and reason.');
      return;
    }

    setSubmitting(true);
    try {
      await tenantService.createNightOutRequest({
        leaveDate,
        returnDate,
        reason,
        destinationAddress: destination || undefined,
      });
      setMsg('Night out request submitted successfully!');
      setLeaveDate('');
      setReturnDate('');
      setReason('');
      setDestination('');
      setShowForm(false);
      loadData();
      setTimeout(() => setMsg(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit night out request.');
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
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-primary-dark active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showForm ? 'View Requests' : activeTab === 'guests' ? 'New Guest' : 'New Night Out'}</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="grid grid-cols-2 rounded-2xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab('guests');
            setShowForm(false);
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            activeTab === 'guests'
              ? 'bg-white text-brandText shadow-sm'
              : 'text-gray-500 hover:text-brandText'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Guest Entry</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('nightout');
            setShowForm(false);
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            activeTab === 'nightout'
              ? 'bg-white text-brandText shadow-sm'
              : 'text-gray-500 hover:text-brandText'
          }`}
        >
          <Moon className="h-4 w-4" />
          <span>Night Out Pass</span>
        </button>
      </div>

      {/* Form or Feed */}
      {showForm ? (
        activeTab === 'guests' ? (
          /* Guest Request Form */
          <form onSubmit={handleGuestSubmit} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-brandText">Register Visitor / Guest Entry</h3>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Guest Full Name</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Amit Kumar"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Guest Phone</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Number of Guests</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={numberOfGuests}
                  onChange={(e) => setNumberOfGuests(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Arrival Date & Time</label>
                <input
                  type="datetime-local"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Expected Departure</label>
                <input
                  type="datetime-local"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Purpose / Relation</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. College Friend, Parent visit"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{submitting ? 'Submitting...' : 'Submit Entry Request'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Night Out Request Form */
          <form onSubmit={handleNightOutSubmit} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <Moon className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-brandText">Submit Night Out Gate Pass</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Departure Date & Time</label>
                <input
                  type="datetime-local"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Expected Return Date</label>
                <input
                  type="datetime-local"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Reason for Night Out</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Traveling home for weekend, Office late shift"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Destination Address / Hometown</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Sector 18, Noida"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-brandText focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{submitting ? 'Submitting...' : 'Submit Pass'}</span>
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
                    ? 'No visitor entries recorded for your room. Tap New Guest to register an upcoming visitor.'
                    : 'Sign in to an active PG stay to register guests.'}
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark"
                >
                  Register Guest
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {guestList.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-brandText">{item.guestName || 'Guest'}</h4>
                        {item.guestPhone && <p className="text-[11px] text-gray-400">{item.guestPhone}</p>}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.status === 'rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-600 border-t border-gray-50 pt-2">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="h-3 w-3 text-gray-400" />
                        Arrival: {new Date(item.expectedArrival).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : nightOutList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Moon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-brandText">No Night Out Passes</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                {isLinkedTenant
                  ? 'No night out passes filed yet. Tap New Night Out to request a gate pass.'
                  : 'Sign in to an active PG stay to submit night out passes.'}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark"
              >
                Apply for Gate Pass
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {nightOutList.map((item) => (
                <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-brandText">{item.reason}</h4>
                      {item.destinationAddress && (
                        <p className="text-[11px] text-gray-400">{item.destinationAddress}</p>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        item.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.status === 'rejected'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-2 text-[11px] text-gray-600">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Leave:</span>
                      <span>{new Date(item.leaveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Return:</span>
                      <span>{new Date(item.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
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
