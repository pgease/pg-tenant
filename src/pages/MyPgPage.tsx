import React, { useState } from 'react';
import {
  Wifi,
  FileText,
  Utensils,
  Phone,
  QrCode,
  Globe,
  Star,
  Bed,
  MapPin,
  CreditCard,
  MessageSquareWarning,
  Users,
  Calendar,
  ShieldCheck,
  X,
  Keyboard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AmenitiesModal } from '../components/my-pg/AmenitiesModal';

export const MyPgPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isLinkedTenant,
    propertyDetails,
    checkTenancy,
  } = useAuth();

  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Derived Dynamic Data for Linked PG
  const propertyName = propertyDetails?.property?.name || 'Active PG Stay';
  const propertyAddress = propertyDetails?.property?.address || propertyDetails?.property?.cityName || '';
  const roomNumber = propertyDetails?.room?.roomNumber ? `Room ${propertyDetails.room.roomNumber}` : '';
  const monthlyRent = propertyDetails?.roomTenant?.monthlyRent ?? 0;

  const handleManualLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setInviteError('Please enter a valid invite code or property code');
      return;
    }
    setLinking(true);
    setInviteError(null);
    try {
      await checkTenancy();
      setShowInviteModal(false);
    } catch {
      setInviteError('Could not verify invite code. Please check with your PG manager.');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="space-y-5 pt-1 pb-6 animate-fade-in">
      {/* Amenities & Security Modal */}
      <AmenitiesModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        amenities={propertyDetails?.amenities}
        facilities={propertyDetails?.facilities}
        restrictions={propertyDetails?.restrictions}
      />

      {/* Manual Invite Code Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-[#008080]" />
                <h3 className="text-sm font-bold text-gray-900">Enter Invite Code</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Enter the 6-character PG property code or invite link shared by your hostel manager.
            </p>

            <form onSubmit={handleManualLink} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. PG-4892"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                autoFocus
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:border-[#008080] focus:outline-none uppercase tracking-widest text-center"
              />

              {inviteError && (
                <p className="text-xs font-semibold text-red-500 text-center">{inviteError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking || !inviteCode.trim()}
                  className="flex-1 rounded-xl bg-[#008080] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#006b6b] disabled:opacity-50"
                >
                  {linking ? 'Linking...' : 'Join Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SCENARIO 1: Tenant is LINKED to an active PG -> Show Full PG Hub   */}
      {/* ------------------------------------------------------------------ */}
      {isAuthenticated && isLinkedTenant ? (
        <div className="space-y-5">
          {/* Linked Stay Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#008080] via-[#006b6b] to-[#004d4d] p-5 text-white shadow-xl shadow-[#008080]/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold backdrop-blur-md">
                <span>Active Stay</span>
              </span>

              {roomNumber && (
                <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold backdrop-blur-md">
                  {roomNumber}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl font-black tracking-tight">{propertyName}</h2>
              {propertyAddress && (
                <p className="flex items-center gap-1 text-xs text-white/80 mt-1">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{propertyAddress}</span>
                </p>
              )}
            </div>

            {/* Inner Rent Card */}
            <div className="rounded-2xl bg-white p-4 text-gray-900 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-gray-500">Monthly Rent</span>
                <p className="text-lg font-black text-gray-900">
                  ₹{monthlyRent.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] font-semibold text-emerald-600">
                  Active Tenancy
                </p>
              </div>

              <button
                onClick={() => navigate('/payments')}
                className="rounded-xl bg-[#008080] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#008080]/20 hover:bg-[#006b6b] active:scale-95 transition-all tap-target"
              >
                Pay Dues
              </button>
            </div>
          </div>

          {/* Quick Actions 4x2 Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider px-1">
              PG Features & Services
            </h3>

            <div className="grid grid-cols-4 gap-2.5">
              <button
                onClick={() => navigate('/wifi')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:border-teal-200 active:scale-95 transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-[#008080] mb-1.5">
                  <Wifi className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-900 text-center">WiFi</span>
              </button>

              <button
                onClick={() => navigate('/food')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:border-orange-200 active:scale-95 transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 mb-1.5">
                  <Utensils className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-900 text-center">Meals</span>
              </button>

              <button
                onClick={() => navigate('/payments')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:border-teal-200 active:scale-95 transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-[#008080] mb-1.5">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-900 text-center">Rent</span>
              </button>

              <button
                onClick={() => navigate('/complaints')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:border-red-200 active:scale-95 transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500 mb-1.5">
                  <MessageSquareWarning className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-900 text-center">Tickets</span>
              </button>

              <button
                onClick={() => navigate('/guests')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:border-blue-200 active:scale-95 transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-1.5">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-900 text-center">Guests</span>
              </button>

              <button
                onClick={() => navigate('/notice')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:border-purple-200 active:scale-95 transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-1.5">
                  <Calendar className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-900 text-center">Notice</span>
              </button>

              <button
                onClick={() => setShowSecurityModal(true)}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:border-emerald-200 active:scale-95 transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-1.5">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-900 text-center">Security</span>
              </button>

              <button
                onClick={() => navigate('/documents')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:border-indigo-200 active:scale-95 transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-1.5">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-900 text-center">Docs</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------------ */
        /* SCENARIO 2: NOT linked to any PG -> Matches Screenshot 3 Exactly   */
        /* ------------------------------------------------------------------ */
        <div className="space-y-4 animate-fade-in">
          {/* Main Hero Card: No Active PG Stay (Matches Screenshot 3) */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm text-center space-y-4">
            {/* Top Light Cyan Circle with Bed Icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E6F7F7] text-[#008080]">
              <Bed className="h-9 w-9 stroke-[1.8]" />
            </div>

            <div>
              <h2 className="text-xl font-black tracking-tight text-gray-900">
                No Active PG Stay
              </h2>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                You are not associated with any PG property yet. Join your PG by scanning the property QR code or exploring available PGs.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {/* Primary Button: Scan Property QR Code */}
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login', { state: { from: { pathname: '/my-pg' } } });
                  } else {
                    setShowInviteModal(true);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#008080] py-3.5 text-xs font-bold text-white shadow-md shadow-[#008080]/20 hover:bg-[#006b6b] active:scale-[0.98] transition-all tap-target"
              >
                <QrCode className="h-4 w-4" />
                <span>Scan Property QR Code</span>
              </button>

              {/* Secondary Button: Explore Available PGs */}
              <button
                type="button"
                onClick={() => navigate('/search')}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-[#008080] bg-white py-3 text-xs font-bold text-[#008080] hover:bg-teal-50 active:scale-[0.98] transition-all tap-target"
              >
                <Globe className="h-4 w-4" />
                <span>Explore Available PGs</span>
              </button>
            </div>
          </div>

          {/* "What you get in My PG" Section (Matches Screenshot 3) */}
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            {/* Section Badge Header */}
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <Star className="h-4 w-4 fill-amber-400 stroke-amber-500" />
              </span>
              <h3 className="text-sm font-bold text-gray-900">What you get in My PG</h3>
            </div>

            {/* Features List */}
            <div className="space-y-3.5 pt-1">
              {/* Feature 1: WiFi */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#008080] flex-shrink-0">
                  <Wifi className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Instant PG WiFi Credentials</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    One-tap access to your property WiFi password & network
                  </p>
                </div>
              </div>

              {/* Feature 2: Digital Rent */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#008080] flex-shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Digital Rent Dues & Receipts</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    Track monthly rent, pay securely & download rent receipts
                  </p>
                </div>
              </div>

              {/* Feature 3: Daily Food Menu */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#008080] flex-shrink-0">
                  <Utensils className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Daily Food Menu & Timing</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    Breakfast, lunch & dinner timings with live daily meals
                  </p>
                </div>
              </div>

              {/* Feature 4: Staff & Contacts */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#008080] flex-shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Direct Staff & Owner Contacts</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    Instant access to property caretaker, manager & emergency helpline
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
