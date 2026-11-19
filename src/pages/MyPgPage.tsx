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
  Package,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AmenitiesModal } from '../components/my-pg/AmenitiesModal';
import { TenantInventoryModal } from '../components/inventory/TenantInventoryModal';

export const MyPgPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isLinkedTenant,
    propertyDetails,
    checkTenancy,
  } = useAuth();

  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Wi-Fi card state
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [wifiCopied, setWifiCopied] = useState(false);

  // Derived Dynamic Data for Linked PG
  const propertyName = propertyDetails?.property?.name || 'Active PG Stay';
  const propertyAddress = propertyDetails?.property?.address || propertyDetails?.property?.cityName || '';
  const roomNumber = propertyDetails?.room?.roomNumber ? `Room ${propertyDetails.room.roomNumber}` : '';
  const bedNumber =
    propertyDetails?.bed?.bedNumber ||
    propertyDetails?.roomTenant?.bedNumberOnAssignment ||
    (propertyDetails as any)?.bedNumber;
  const roomAndBedLabel = roomNumber ? `${roomNumber}${bedNumber ? ` · Bed ${bedNumber}` : ''}` : '';

  const monthlyRent = Number(
    propertyDetails?.roomTenant?.rentAmount ??
    (propertyDetails?.roomTenant as any)?.monthlyRent ??
    propertyDetails?.room?.monthlyRent ??
    0
  );

  const securityDeposit = Number(
    propertyDetails?.roomTenant?.securityDeposit ??
    (propertyDetails?.roomTenant as any)?.depositAmount ??
    propertyDetails?.room?.securityDeposit ??
    0
  );

  const mapsUrl =
    (propertyDetails?.property as any)?.googleMapsUrl ||
    (propertyAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${propertyName} ${propertyAddress}`)}`
      : '');

  // Owner details (TW-12)
  const owner = (propertyDetails as any)?.owner || {
    name: propertyDetails?.property?.ownerName || 'Property Owner',
    phone: propertyDetails?.property?.contactNumber,
  };
  const rawOwnerPhone = owner?.phone || owner?.mobileContactNumber || propertyDetails?.property?.contactNumber;
  const cleanOwnerPhone = rawOwnerPhone ? String(rawOwnerPhone).replace(/[^0-9]/g, '').slice(-10) : '';

  // Staff list (TW-12)
  const staffList = Array.isArray(propertyDetails?.staff)
    ? propertyDetails.staff.filter((s: any) => !s.isMainOwner)
    : [];

  // Amenities list (TW-12)
  const rawAmenities = [
    ...(Array.isArray(propertyDetails?.amenities) ? propertyDetails.amenities : []),
    ...(Array.isArray(propertyDetails?.facilities) ? propertyDetails.facilities : []),
  ];
  const displayAmenities = rawAmenities
    .map((item: any) => (typeof item === 'string' ? item : item?.name || item?.label || ''))
    .filter(Boolean);

  // Wi-Fi details (TW-09)
  const wifi = propertyDetails?.wifi || null;
  const wifiSsid = wifi?.ssid || null;
  const wifiPassword = wifi?.password || null;

  const handleCopyWifi = () => {
    if (!wifiPassword) return;
    navigator.clipboard.writeText(wifiPassword);
    setWifiCopied(true);
    setTimeout(() => setWifiCopied(false), 2000);
  };

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
        security={(propertyDetails as any)?.security}
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
              {roomAndBedLabel && (
                <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold backdrop-blur-md">
                  {roomAndBedLabel}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl font-black tracking-tight">{propertyName}</h2>
              {propertyAddress && (
                <div className="flex items-center justify-between gap-2 mt-1.5 flex-wrap">
                  <p className="flex items-center gap-1 text-xs text-white/80">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-300" />
                    <span className="truncate max-w-[240px] sm:max-w-md">{propertyAddress}</span>
                  </p>

                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-bold text-teal-100 hover:bg-white/25 transition-all"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Open in Maps</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Inner Rent & Deposit Card */}
            <div className="rounded-2xl bg-white p-4 text-gray-900 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-gray-500">Monthly Rent & Dues</span>
                <p className="text-lg font-black text-gray-900">
                  ₹{monthlyRent.toLocaleString('en-IN')}
                  <span className="text-xs font-semibold text-gray-400">/mo</span>
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-semibold text-emerald-600">Active Stay</span>
                  {securityDeposit > 0 && (
                    <span className="text-[11px] text-gray-400 font-medium">
                      • Deposit: ₹{securityDeposit.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate('/payments')}
                className="rounded-xl bg-[#008080] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#008080]/20 hover:bg-[#006b6b] active:scale-95 transition-all tap-target"
              >
                Pay Dues
              </button>
            </div>
          </div>

          {/* Move-In Inventory Handover Banner Card */}
          <div
            onClick={() => setShowInventoryModal(true)}
            className="rounded-3xl border border-teal-200/90 bg-gradient-to-r from-teal-50/90 via-emerald-50/50 to-teal-50/70 p-4 flex items-center justify-between cursor-pointer hover:border-teal-300 shadow-xs active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#008080] text-white shadow-md shadow-[#008080]/20">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-gray-900">Items Given to Me</span>
                  <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                    Annexure A
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  View bed & room furniture, electronics, keys & move-in condition
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-teal-700 shrink-0" />
          </div>

          {/* Quick Actions 4x2 Grid */}
          <div className="space-y-2.5">
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

          {/* Owner & Staff Contacts Section (TW-12) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider px-1">
              Owner & Staff Contacts
            </h3>

            {/* Owner Card */}
            <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                    Property Owner / Manager
                  </span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {owner?.name || 'Property Owner'}
                  </p>
                  {cleanOwnerPhone ? (
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      +91 {cleanOwnerPhone}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Contact phone available in office</p>
                  )}
                </div>

                {cleanOwnerPhone && (
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:+91${cleanOwnerPhone}`}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-primary hover:bg-teal-100 transition-colors"
                      title="Call Owner"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                    <a
                      href={`https://wa.me/91${cleanOwnerPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      title="WhatsApp Owner"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Staff list if any */}
            {staffList.length > 0 && (
              <div className="space-y-2">
                {staffList.map((st: any, idx: number) => {
                  const staffPhone = st.mobileContactNumber || st.phone;
                  const cleanStaffPhone = staffPhone ? String(staffPhone).replace(/[^0-9]/g, '').slice(-10) : '';

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                          {st.designation || 'Hostel Staff'}
                        </span>
                        <p className="text-xs font-bold text-gray-900 mt-0.5">
                          {st.name || 'Staff Member'}
                        </p>
                        {cleanStaffPhone && (
                          <p className="text-[11px] text-gray-500 font-mono">+91 {cleanStaffPhone}</p>
                        )}
                      </div>

                      {cleanStaffPhone && (
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:+91${cleanStaffPhone}`}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                            title="Call Staff"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/91${cleanStaffPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="WhatsApp Staff"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Wi-Fi Preview Card (TW-09) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider px-1">
              PG Wi-Fi Network
            </h3>

            {wifiSsid ? (
              <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-primary">
                      <Wifi className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">SSID</span>
                      <p className="text-sm font-bold text-gray-900">{wifiSsid}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/wifi')}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                  >
                    <span>Details</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {wifiPassword && (
                  <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-teal-800">Pass:</span>
                      <span className="font-mono text-xs font-bold text-gray-900">
                        {showWifiPassword ? wifiPassword : '••••••••'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowWifiPassword(!showWifiPassword)}
                        className="p-1 rounded-md text-gray-500 hover:bg-white"
                        title={showWifiPassword ? 'Hide password' : 'Show password'}
                      >
                        {showWifiPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyWifi}
                        className="px-2 py-0.5 rounded-md bg-white border border-teal-200 text-[11px] font-bold text-primary hover:bg-teal-50 flex items-center gap-1"
                      >
                        {wifiCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        <span>{wifiCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center text-xs text-gray-500">
                Your PG hasn't added Wi-Fi details yet.
              </div>
            )}
          </div>

          {/* Amenities & Facilities Preview Grid (TW-12) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Amenities & Facilities
              </h3>
              <button
                type="button"
                onClick={() => setShowSecurityModal(true)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                <span>View All ({displayAmenities.length})</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {displayAmenities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {displayAmenities.slice(0, 6).map((item: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-2.5 shadow-2xs"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-primary shrink-0">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-gray-800 truncate">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center text-xs text-gray-500">
                Amenities not specified yet by PG manager.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------------ */
        /* SCENARIO 2: NOT linked to any PG -> Matches Screenshot 3 Exactly   */
        /* ------------------------------------------------------------------ */
        <div className="space-y-4 animate-fade-in">
          {/* Main Hero Card: No Active PG Stay */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm text-center space-y-4">
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

          {/* "What you get in My PG" Section */}
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <Star className="h-4 w-4 fill-amber-400 stroke-amber-500" />
              </span>
              <h3 className="text-sm font-bold text-gray-900">What you get in My PG</h3>
            </div>

            <div className="space-y-3.5 pt-1">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#008080] shrink-0">
                  <Wifi className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Instant PG WiFi Credentials</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    One-tap access to your property WiFi password & network
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#008080] shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Digital Rent Dues & Receipts</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    Track monthly rent, pay securely & download rent receipts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#008080] shrink-0">
                  <Utensils className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Daily Food Menu & Timing</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    Breakfast, lunch & dinner timings with live daily meals
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#008080] shrink-0">
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

      {/* Tenant Move-In Handover Inventory Modal */}
      <TenantInventoryModal
        open={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        tenantId={propertyDetails?.roomTenant?.id || propertyDetails?.tenant?.id || ''}
        roomNumber={String(propertyDetails?.room?.roomNumber || '')}
        bedNumber={String(propertyDetails?.roomTenant?.bedNumber || propertyDetails?.tenant?.bedNumber || '')}
      />
    </div>
  );
};
