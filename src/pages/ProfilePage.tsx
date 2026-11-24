import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import {
  LogOut,
  ChevronRight,
  Bell,
  Star,
  Gift,
  Shield,
  Phone,
  HelpCircle,
  Settings,
  X,
  Share2,
  CheckCircle,
  Wifi,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
  Home,
  Users,
  UtensilsCrossed,
  Receipt,
  CreditCard,
  ShieldCheck,
  Wrench,
  Clock,
  DoorOpen,
  FileSignature,
  Globe,
  Info,
  Pencil,
  MessageSquare,
  BadgeCheck,
  Search,
  Bookmark,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StaffModal } from '../components/my-pg/StaffModal';
import { AmenitiesModal } from '../components/my-pg/AmenitiesModal';

export const ProfilePage: React.FC = () => {
  const { isAuthenticated, isLinkedTenant, tenant, propertyDetails, logout, checkTenancy } = useAuth();
  const navigate = useNavigate();

  // Active Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showReferModal, setShowReferModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Profile Form State
  const [name, setName] = useState(tenant?.name || '');
  const [email, setEmail] = useState(tenant?.email || '');
  const [imgError, setImgError] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep local fields in sync with auth context tenant data
  useEffect(() => {
    if (tenant) {
      if (tenant.name) setName(tenant.name);
      if (tenant.email) setEmail(tenant.email);
      setImgError(false);
    }
  }, [tenant]);

  const rawPhoto =
    tenant?.profilePhotoUrl ||
    tenant?.photoUrl ||
    tenant?.imageUrl ||
    tenant?.selfieUrl ||
    tenant?.avatarUrl ||
    tenant?.kycInfo?.selfieUrl ||
    tenant?.kycInfo?.photoUrl ||
    tenant?.kycInfo?.verifiedDetails?.photo ||
    propertyDetails?.tenant?.profilePhotoUrl ||
    propertyDetails?.tenant?.photoUrl ||
    '';
  const tenantPhoto = !imgError && typeof rawPhoto === 'string' && rawPhoto.trim() ? rawPhoto.trim() : '';

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP).');
      return;
    }
    setIsUploadingPhoto(true);
    try {
      await authService.uploadProfilePhoto(file);
      setImgError(false);
      await checkTenancy();
    } catch (err: any) {
      console.error('Failed to upload photo:', err);
      alert(err?.response?.data?.message || 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleOpenEditModal = () => {
    setName(tenant?.name || '');
    setEmail(tenant?.email || '');
    setProfileMsg(null);
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    setProfileMsg(null);
    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setProfileMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsSavingProfile(true);
    try {
      await authService.updateProfile({
        name: name.trim() || undefined,
        email: trimmedEmail || undefined,
      });
      await checkTenancy();
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => {
        setShowEditModal(false);
        setProfileMsg(null);
      }, 1000);
    } catch (err: any) {
      setProfileMsg({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const phone = tenant?.phone
    ? tenant.phone.startsWith('+91')
      ? tenant.phone
      : `+91 ${tenant.phone}`
    : '';

  // Rating State
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // User initials
  const initials = (name || tenant?.name || 'GT')
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'GT';

  const handleShareReferral = () => {
    const text = `Hey! Check out PG Ease to discover verified hostels and PGs with zero brokerage: https://tenant.pgease.com`;
    if (navigator.share) {
      navigator.share({ title: 'PG Ease', text, url: 'https://tenant.pgease.com' }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const tenantName = name || tenant?.name || (isAuthenticated ? 'PG Resident' : 'Guest Explorer');
  const roomName = isLinkedTenant && propertyDetails?.room?.roomNumber
    ? `Room ${propertyDetails.room.roomNumber}`
    : isLinkedTenant
    ? 'Allocated Room'
    : 'Not linked to a PG';
  const pgName = isLinkedTenant ? propertyDetails?.property?.name || 'PG Ease Stay' : 'Explore verified PGs';

  return (
    <div className="space-y-5 pt-1 pb-8 animate-fade-in">
      {/* Hidden file input for photo upload */}
      <input
        id="tenant-profile-photo-hidden"
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="sr-only"
        onChange={handlePhotoSelected}
      />

      {/* T2 / T8 Header: 64dp Round Avatar, Name, Room + PG Name, Edit Profile Button */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-sm text-center">
        <div className="flex flex-col items-center">
          {/* 64dp Round Avatar with Camera Badge */}
          <div className="relative mb-3 group">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-[#008080] font-bold text-white text-xl shadow-md overflow-hidden shrink-0">
              {isUploadingPhoto ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : isAuthenticated && tenantPhoto ? (
                <img
                  src={tenantPhoto}
                  alt={tenantName}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                  onError={() => setImgError(true)}
                />
              ) : isAuthenticated ? (
                initials
              ) : (
                'G'
              )}
            </div>

            {isAuthenticated && (
              <label
                htmlFor="tenant-profile-photo-hidden"
                className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-[#008080] text-white shadow-md border-2 border-white hover:bg-[#005F5F] transition-colors"
                title="Upload profile photo"
              >
                <Camera className="h-3 w-3" />
              </label>
            )}
          </div>

          {/* Tenant Name */}
          <h2 className="text-base font-bold text-brandText tracking-tight">
            {isAuthenticated ? tenantName : 'Guest Explorer'}
          </h2>

          {/* Room Number & PG Name */}
          {isAuthenticated ? (
            <>
              <p className="text-xs font-semibold text-[#008080] mt-0.5">
                {roomName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {pgName}
              </p>
              {phone && (
                <p className="text-[11px] text-gray-400 font-mono mt-1">
                  {phone}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5 max-w-xs mx-auto leading-relaxed">
              Sign in to see your PG, payments and documents
            </p>
          )}

          {/* Action Button: Edit Profile / Sign In */}
          <div className="mt-3.5">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50/80 px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-100 active:scale-95 transition-all"
              >
                <Pencil className="h-3 w-3 text-gray-500" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-full bg-[#008080] px-5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#006b6b]"
              >
                Sign In with OTP
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Stay Info Strip (Only for logged-in resident, hidden for guest) */}
        {isAuthenticated && (
          <div className="mt-4 grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 pt-3 text-center">
            <div>
              <span className="block text-xs font-bold text-[#008080] leading-tight line-clamp-1 px-1">
                {isLinkedTenant ? propertyDetails?.property?.name || 'Linked' : 'Not Linked'}
              </span>
              <span className="text-[10px] font-medium text-gray-400">Assigned PG</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-emerald-600 truncate px-1">
                {isLinkedTenant && propertyDetails?.room?.roomNumber
                  ? `Room ${propertyDetails.room.roomNumber}`
                  : isLinkedTenant
                  ? 'Allocated'
                  : '—'}
              </span>
              <span className="text-[10px] font-medium text-gray-400">Room / Bed</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-teal-700 truncate px-1">
                {isLinkedTenant ? 'Active Resident' : 'Registered'}
              </span>
              <span className="text-[10px] font-medium text-gray-400">Status</span>
            </div>
          </div>
        )}
      </div>

      {isAuthenticated ? (
        <>
          {/* T8: Group 1: My Stay */}
      <div className="space-y-2">
        <h3 className="px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          My Stay
        </h3>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
          {/* Room Details */}
          <button
            type="button"
            onClick={() => navigate('/my-pg')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <Home className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Room Details</span>
                <span className="block text-xs text-gray-500 truncate">
                  {isLinkedTenant && propertyDetails?.room?.roomNumber
                    ? `Room ${propertyDetails.room.roomNumber}, floor & bed info`
                    : 'View room specifications & allocated bed'}
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          {/* Roommates */}
          <button
            type="button"
            onClick={() => navigate('/my-pg')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Roommates</span>
                <span className="block text-xs text-gray-500 truncate">
                  View your co-residents & contact details
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          {/* Wi-Fi Details */}
          <button
            type="button"
            onClick={() => navigate('/wifi')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <Wifi className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Wi-Fi Details</span>
                <span className="block text-xs text-gray-500 truncate">
                  Network SSID name & Wi-Fi password
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          {/* Food Menu */}
          <button
            type="button"
            onClick={() => navigate('/food')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Food Menu</span>
                <span className="block text-xs text-gray-500 truncate">
                  Today's meals & weekly mess schedule
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>
        </div>
      </div>

      {/* T8: Group 2: Payments & Dues */}
      <div className="space-y-2">
        <h3 className="px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Payments & Dues
        </h3>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
          {/* Rent Receipts */}
          <button
            type="button"
            onClick={() => navigate('/payments/history')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <Receipt className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Rent Receipts</span>
                <span className="block text-xs text-gray-500 truncate">
                  Download past rent receipts & tax invoices
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          {/* Payment Methods */}
          <button
            type="button"
            onClick={() => navigate('/payments')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Payment Methods</span>
                <span className="block text-xs text-gray-500 truncate">
                  UPI, debit card & net banking payment gateways
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          {/* Security Deposit */}
          <button
            type="button"
            onClick={() => navigate('/payments')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Security Deposit</span>
                <span className="block text-xs text-gray-500 truncate">
                  Deposit balance & refund tracking
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>
        </div>
      </div>

      {/* T8: Group 3: Services */}
      <div className="space-y-2">
        <h3 className="px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Services
        </h3>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
          {/* Maintenance Requests */}
          <button
            type="button"
            onClick={() => navigate('/complaints')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <Wrench className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Maintenance Requests</span>
                <span className="block text-xs text-gray-500 truncate">
                  Raise repair tickets & track resolution status
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          {/* Notice Period */}
          <button
            type="button"
            onClick={() => navigate('/notice-period')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <Clock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Notice Period</span>
                <span className="block text-xs text-gray-500 truncate">
                  Vacate intimation & checkout schedule
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          {/* Gate Pass */}
          <button
            type="button"
            onClick={() => navigate('/guests')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <DoorOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Gate Pass</span>
                <span className="block text-xs text-gray-500 truncate">
                  Guest entry approval & night-out passes
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>
        </div>
      </div>

      {/* T8: Group 4: Documents */}
      <div className="space-y-2">
        <h3 className="px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Documents
        </h3>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
          {/* Aadhaar KYC */}
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Aadhaar KYC</span>
                <span className="block text-xs text-gray-500 truncate">
                  Verify your identity with DigiLocker
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          {/* Rental Agreement */}
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <FileSignature className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Rental Agreement</span>
                <span className="block text-xs text-gray-500 truncate">
                  Digital stay agreement & e-sign status
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>
        </div>
      </div>
    </>
  ) : (
    /* GUEST DISCOVERY & INFORMATION */
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Explore & Save
        </h3>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <Search className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Explore PGs</span>
                <span className="block text-xs text-gray-500 truncate">
                  Search verified stays with zero brokerage
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/saved')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <Bookmark className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Saved Properties</span>
                <span className="block text-xs text-gray-500 truncate">
                  View bookmarked properties
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )}

      {/* T8: Group 5: App Settings */}
      <div className="space-y-2">
        <h3 className="px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          App Settings
        </h3>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
          {/* Notifications */}
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <Bell className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Notifications</span>
                <span className="block text-xs text-gray-500 truncate">
                  Due alerts, gate passes & notice board reminders
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          {/* Language */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <Globe className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Language</span>
                <span className="block text-xs text-gray-500 truncate">
                  English (India)
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          {/* App Version */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <Info className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">App Version</span>
                <span className="block text-xs text-gray-500 truncate">
                  v1.0.5 (Build 6) • Latest release
                </span>
              </div>
            </div>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-[#008080]">
              v1.0.5
            </span>
          </button>
        </div>
      </div>

      {/* T8: Group 6: Help & Support */}
      <div className="space-y-2">
        <h3 className="px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Help & Support
        </h3>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
          {/* Contact Warden / Manager */}
          <button
            type="button"
            onClick={() => setShowStaffModal(true)}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <Phone className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Contact Warden / Manager</span>
                <span className="block text-xs text-gray-500 truncate">
                  Hostel manager, supervisor & caretaker contacts
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          {/* Support WhatsApp */}
          <button
            type="button"
            onClick={() => window.open('https://wa.me/918126749964', '_blank')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Support WhatsApp</span>
                <span className="block text-xs text-gray-500 truncate">
                  Chat directly with the PG Ease team (+91 81267 49964)
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          {/* FAQs */}
          <button
            type="button"
            onClick={() => setShowFaqModal(true)}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">FAQs</span>
                <span className="block text-xs text-gray-500 truncate">
                  Payment questions, notice policy & app guide
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          {/* Rate Your PG */}
          <button
            type="button"
            onClick={() => setShowRateModal(true)}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <Star className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Rate Your PG</span>
                <span className="block text-xs text-gray-500 truncate">
                  Share reviews and feedback about your stay
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          {/* Refer & Earn */}
          <button
            type="button"
            onClick={() => setShowReferModal(true)}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <Gift className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">Refer & Earn</span>
                <span className="block text-xs text-gray-500 truncate">
                  Invite friends to PG Ease and earn rewards
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          {/* House Rules & Amenities */}
          <button
            type="button"
            onClick={() => setShowSecurityModal(true)}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F3F3] text-[#008080]">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-brandText">House Rules & Facilities</span>
                <span className="block text-xs text-gray-500 truncate">
                  Curfew hours, visitor policies & verified amenities
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>
        </div>
      </div>

      {/* T8: Logout Button (Red, destructive, confirm dialog) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            if (isAuthenticated) {
              if (window.confirm('Are you sure you want to log out of PG Ease?')) {
                logout();
              }
            } else {
              navigate('/login');
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-3.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 active:scale-98 transition-all"
        >
          <LogOut className="h-4 w-4 text-red-600" />
          <span>{isAuthenticated ? 'Log Out' : 'Sign In with OTP'}</span>
        </button>
      </div>

      {/* Footer Branding */}
      <p className="text-center text-[11px] text-gray-400 font-medium">
        PG Ease v1.0.5 • Made with ❤️ in India
      </p>

      {/* MODALS */}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-brandText">Edit Profile</h3>
              <button
                onClick={() => {
                  if (!isSavingProfile) {
                    setShowEditModal(false);
                    setProfileMsg(null);
                  }
                }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {profileMsg && (
              <div
                className={`rounded-2xl p-3 text-xs font-semibold flex items-center gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* Photo Upload in Edit Modal */}
              <div className="flex flex-col items-center justify-center py-1">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#008080] bg-[#E6F3F3] font-bold text-[#008080] text-2xl overflow-hidden shadow-sm">
                  {isUploadingPhoto ? (
                    <Loader2 className="h-7 w-7 animate-spin text-[#008080]" />
                  ) : tenantPhoto ? (
                    <img
                      src={tenantPhoto}
                      alt=""
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    initials
                  )}
                </div>
                <button
                  type="button"
                  disabled={isUploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-[#E6F3F3] hover:bg-teal-100 px-3 py-1 text-xs font-bold text-[#008080] transition-all active:scale-95"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>{tenantPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-600">Full Name</label>
                  <span className={`text-[10px] tabular-nums font-mono ${name.length >= 100 ? "text-red-500 font-bold" : "text-gray-400"}`}>
                    {name.length}/100
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={100}
                  value={name}
                  disabled={isSavingProfile}
                  onChange={(e) => setName(e.target.value.slice(0, 100))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-brandText focus:border-[#008080] focus:outline-none"
                  placeholder="Your full name"
                />
                <span className="text-[10px] text-gray-400 block mt-1">Your PG manager will see this update</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Email Address</label>
                <input
                  type="email"
                  maxLength={100}
                  value={email}
                  disabled={isSavingProfile}
                  onChange={(e) => setEmail(e.target.value.slice(0, 100))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-brandText focus:border-[#008080] focus:outline-none"
                  placeholder="e.g. resident@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Mobile Number</label>
                <input
                  type="text"
                  disabled
                  value={phone}
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  Mobile number is linked to your account. Contact your PG manager for changes.
                </span>
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                disabled={isSavingProfile}
                onClick={() => {
                  setShowEditModal(false);
                  setProfileMsg(null);
                }}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingProfile}
                onClick={handleSaveProfile}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#008080] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#006b6b] disabled:opacity-60"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Your PG Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                <h3 className="text-base font-bold text-brandText">Rate Your PG</h3>
              </div>
              <button onClick={() => setShowRateModal(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {ratingSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-brandText">Thank you for your rating!</p>
                <button
                  onClick={() => {
                    setRatingSubmitted(false);
                    setShowRateModal(false);
                  }}
                  className="mt-3 rounded-xl bg-[#008080] px-5 py-2 text-xs font-bold text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">
                  How has your experience been at {propertyDetails?.property?.name || 'your PG'}?
                </p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="p-1 tap-target">
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-gray-600">Feedback</label>
                    <span className={`text-[10px] tabular-nums font-mono ${feedback.length >= 254 ? "text-red-500 font-bold" : "text-gray-400"}`}>
                      {feedback.length}/254
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={254}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value.slice(0, 254))}
                    placeholder="Tell us about food, WiFi, cleanliness, or amenities..."
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-brandText focus:border-[#008080] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setRatingSubmitted(true)}
                  className="w-full rounded-xl bg-[#008080] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#006b6b]"
                >
                  Submit Review
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refer & Earn Modal */}
      {showReferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl space-y-4 text-center">
            <div className="flex justify-end">
              <button onClick={() => setShowReferModal(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E6F3F3] text-[#008080] mb-2">
                <Gift className="h-7 w-7" />
              </div>
              <h3 className="text-base font-black text-brandText">Refer PG Ease to Friends</h3>
              <p className="text-xs text-gray-500 mt-1">
                Help friends discover verified PGs with zero brokerage and direct host connect.
              </p>
            </div>

            <button
              type="button"
              onClick={handleShareReferral}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#008080] py-3 text-xs font-bold text-white shadow-md shadow-teal-750/20 hover:bg-[#006b6b]"
            >
              <Share2 className="h-4 w-4" />
              <span>Share on WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* House Rules & Security Modal */}
      <AmenitiesModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        amenities={propertyDetails?.amenities}
        facilities={propertyDetails?.facilities}
        restrictions={propertyDetails?.restrictions}
      />

      {/* Staff Modal */}
      {showStaffModal && (
        <StaffModal
          isOpen={showStaffModal}
          onClose={() => setShowStaffModal(false)}
          staffMembers={propertyDetails?.staff}
          propertyOwner={propertyDetails?.property}
        />
      )}

      {/* Help & FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#008080]" />
                <h3 className="text-base font-bold text-brandText">Help & FAQ</h3>
              </div>
              <button onClick={() => setShowFaqModal(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 text-xs text-gray-600">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="font-bold text-brandText">When is my rent due each month?</p>
                <p className="mt-1 text-gray-500">
                  Rent cycles are generated monthly as configured by your property owner. Check your Payments tab for active dues.
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <p className="font-bold text-brandText">How do I submit a maintenance request?</p>
                <p className="mt-1 text-gray-500">
                  Navigate to Complaints from Services. You can specify category and describe the repair issue.
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <p className="font-bold text-brandText">What is the checkout notice period?</p>
                <p className="mt-1 text-gray-500">
                  Most PGs require a 30-day notice prior to checkout. You can submit notice directly from the Notice page.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFaqModal(false)}
              className="w-full rounded-xl bg-gray-100 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#008080]" />
                <h3 className="text-base font-bold text-brandText">App Settings</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="font-semibold text-brandText">Language</span>
                <span className="text-gray-500">English (India)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="font-semibold text-brandText">App Version</span>
                <span className="text-[#008080] font-semibold">v1.0.5 (Build 6)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="font-semibold text-brandText">Theme</span>
                <span className="text-gray-500">Light Mode (Default)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="w-full rounded-xl bg-gray-100 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
