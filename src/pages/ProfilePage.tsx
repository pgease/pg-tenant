import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import {
  User as UserIcon,
  LogOut,
  ChevronRight,
  FileText,
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

  return (
    <div className="space-y-5 pt-1 pb-6 animate-fade-in">
      {/* 1. Profile User Card (Dynamic from authenticated state) */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Avatar Circle with Photo or Initials */}
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelected}
              />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-teal-50 font-bold text-primary text-lg overflow-hidden shrink-0 shadow-sm">
                {isUploadingPhoto ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : tenantPhoto ? (
                  <img
                    src={tenantPhoto}
                    alt={name || 'Tenant'}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  initials
                )}
              </div>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary-dark transition-all active:scale-95 border-2 border-white tap-target"
                  title="Upload profile photo"
                >
                  <Camera className="h-3 w-3" />
                </button>
              )}
            </div>

            <div>
              <h2 className="text-base font-bold text-brandText tracking-tight">
                {name || tenant?.name || (isAuthenticated ? 'PG Resident' : 'Guest Explorer')}
              </h2>
              {email ? (
                <p className="text-xs text-gray-500 mt-0.5">{email}</p>
              ) : null}
              <p className="text-xs text-gray-500">
                {phone || 'Sign in to access your stay'}
              </p>
            </div>
          </div>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-1 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-xl bg-primary px-3.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-primary-dark"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Dynamic Stay Info Row (Replaces static 4 Months/48K/2 Referrals) */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 pt-3 text-center">
          <div>
            <span className="block text-xs font-bold text-primary truncate px-1">
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
              {isAuthenticated ? (isLinkedTenant ? 'Active' : 'Registered') : 'Guest'}
            </span>
            <span className="text-[10px] font-medium text-gray-400">Status</span>
          </div>
        </div>
      </div>

      {/* 2. ACCOUNT Section */}
      <div className="space-y-1.5">
        <h3 className="px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Account
        </h3>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
          {/* Edit Profile */}
          <button
            type="button"
            onClick={() => (isAuthenticated ? handleOpenEditModal() : navigate('/login'))}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors tap-target"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-primary">
                <UserIcon className="h-4 w-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-brandText">Edit Profile</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>

          {/* Documents -> Dedicated Page */}
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors tap-target"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-brandText">Documents & KYC</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>

          {/* Notifications -> Dedicated Page */}
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors tap-target"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-primary">
                <Bell className="h-4 w-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-brandText">Notifications</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* 3. PG Section */}
      <div className="space-y-1.5">
        <h3 className="px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          PG Stay
        </h3>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
          {/* Rate Your PG */}
          <button
            type="button"
            onClick={() => setShowRateModal(true)}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors tap-target"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-primary">
                <Star className="h-4 w-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-brandText">Rate Your PG</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>

          {/* Refer & Earn */}
          <button
            type="button"
            onClick={() => setShowReferModal(true)}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors tap-target"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-primary">
                <Gift className="h-4 w-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-brandText">Refer & Earn</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>

          {/* Security & Rules */}
          <button
            type="button"
            onClick={() => setShowSecurityModal(true)}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors tap-target"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-primary">
                <Shield className="h-4 w-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-brandText">House Rules & Security</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>

          {/* WiFi Details */}
          <button
            type="button"
            onClick={() => navigate('/wifi')}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors tap-target"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-primary">
                <Wifi className="h-4 w-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-brandText">WiFi Credentials</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* 4. SUPPORT Section */}
      <div className="space-y-1.5">
        <h3 className="px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Support
        </h3>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
          {/* Contact PG Owner */}
          <button
            type="button"
            onClick={() => setShowStaffModal(true)}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors tap-target"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-primary">
                <Phone className="h-4 w-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-brandText">Contact PG Staff</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>

          {/* Help & FAQ */}
          <button
            type="button"
            onClick={() => setShowFaqModal(true)}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors tap-target"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-primary">
                <HelpCircle className="h-4 w-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-brandText">Help & FAQ</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex w-full items-center justify-between p-3.5 text-left hover:bg-gray-50/80 active:bg-gray-100 transition-colors tap-target"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-primary">
                <Settings className="h-4 w-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-brandText">Settings</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* 5. Log Out / Sign In Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            if (isAuthenticated) {
              if (window.confirm('Are you sure you want to log out?')) {
                logout();
              }
            } else {
              navigate('/login');
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-3.5 text-sm font-semibold text-red-500 shadow-sm hover:bg-red-50 active:scale-98 transition-all tap-target"
        >
          <LogOut className="h-4 w-4 text-red-500" />
          <span>{isAuthenticated ? 'Log Out' : 'Sign In with OTP'}</span>
        </button>
      </div>

      {/* 6. Footer */}
      <p className="text-center text-[11px] text-gray-400 font-medium">
        PG Ease v1.0.0 • Made with ❤️ in India
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
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-teal-50 font-bold text-primary text-2xl overflow-hidden shadow-sm">
                  {isUploadingPhoto ? (
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
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
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-teal-50/60 hover:bg-teal-100/70 px-3 py-1 text-xs font-bold text-primary transition-all active:scale-95"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>{tenantPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  disabled={isSavingProfile}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-brandText focus:border-primary focus:outline-none"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled={isSavingProfile}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-brandText focus:border-primary focus:outline-none"
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
                  Mobile number cannot be changed here. Contact your PG manager.
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
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-60"
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
                  className="mt-3 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white"
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
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Feedback</label>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us about food, WiFi, cleanliness, or amenities..."
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-brandText focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setRatingSubmitted(true)}
                  className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark"
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
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-primary mb-2">
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark"
            >
              <Share2 className="h-4 w-4" />
              Share on WhatsApp
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
                <HelpCircle className="h-5 w-5 text-primary" />
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
                  Navigate to the Complaints page from Quick Actions. You can specify category and attach a photo.
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
                <Settings className="h-5 w-5 text-primary" />
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
                <span className="text-gray-500">v1.0.0 (Tenant Build)</span>
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
