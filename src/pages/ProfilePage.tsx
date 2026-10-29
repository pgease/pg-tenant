import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StaffModal } from '../components/my-pg/StaffModal';
import { AmenitiesModal } from '../components/my-pg/AmenitiesModal';

export const ProfilePage: React.FC = () => {
  const { isAuthenticated, isLinkedTenant, tenant, propertyDetails, logout } = useAuth();
  const navigate = useNavigate();

  // Active Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showReferModal, setShowReferModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Profile Form State
  const [name, setName] = useState(tenant?.name || '');
  const [email, setEmail] = useState(tenant?.email || '');
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
    const text = `Hey! Check out PG Ease to discover verified hostels and PGs with zero brokerage: https://tenant.pgease.in`;
    if (navigator.share) {
      navigator.share({ title: 'PG Ease', text, url: 'https://tenant.pgease.in' }).catch(() => {});
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
            {/* Avatar Circle with Initials */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-teal-50 font-bold text-primary text-lg">
              {initials}
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
            onClick={() => (isAuthenticated ? setShowEditModal(true) : navigate('/login'))}
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
              <button onClick={() => setShowEditModal(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-brandText focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-brandText focus:border-primary focus:outline-none"
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
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark"
              >
                Save
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
