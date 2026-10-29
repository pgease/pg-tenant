import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  QrCode,
  Keyboard,
  Search,
  SlidersHorizontal,
  Bookmark,
  Bell,
  Pencil,
  Plus,
  Loader2,
  X,
  Building2,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { searchService, type PropertyListItem } from '../services/searchService';
import { PropertyCard } from '../components/search/PropertyCard';
import { FilterDrawer } from '../components/search/FilterDrawer';
import { authService } from '../services/authService';

export const HomePage: React.FC = () => {
  const {
    isAuthenticated,
    isLinkedTenant,
    propertyDetails,
    checkTenancy,
    tenant,
    login,
  } = useAuth();
  const navigate = useNavigate();

  // Search & Nearby PGs state
  const [nearbyPgs, setNearbyPgs] = useState<PropertyListItem[]>([]);
  const [loadingNearby, setLoadingNearby] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Manual Invite / QR modal state
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [linking, setLinking] = useState<boolean>(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Edit Name Modal State
  const [showEditNameModal, setShowEditNameModal] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(tenant?.name || '');
  const [savingName, setSavingName] = useState<boolean>(false);

  const isGuestMode = sessionStorage.getItem('pgease_guest_mode') === 'true';

  // First time visitor without guest mode -> redirect to /login
  if (!isAuthenticated && !isGuestMode) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    let isMounted = true;
    setLoadingNearby(true);
    searchService
      .searchPgs({ limit: 10 })
      .then((res) => {
        if (isMounted) {
          setNearbyPgs(res.properties);
        }
      })
      .catch((err) => console.error('Error loading nearby PGs:', err))
      .finally(() => {
        if (isMounted) setLoadingNearby(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  // Handle Manual Code / QR Verification
  const handleManualLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setLinkError('Please enter a valid property invite code');
      return;
    }
    setLinking(true);
    setLinkError(null);
    try {
      await checkTenancy();
      setShowInviteModal(false);
    } catch {
      setLinkError('Invalid invite code or property not found. Please contact PG owner.');
    } finally {
      setLinking(false);
    }
  };

  // Handle Name Update
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      const updatedTenant = await authService.updateProfile({ name: nameInput.trim() });
      const currentToken = localStorage.getItem('pgease_tenant_token') || '';
      const currentRefresh = localStorage.getItem('pgease_tenant_refresh') || '';
      await login(currentToken, currentRefresh, updatedTenant);
      setShowEditNameModal(false);
    } catch (err) {
      console.error('Failed to update name:', err);
    } finally {
      setSavingName(false);
    }
  };

  const displayName = tenant?.name || 'Add your name';

  return (
    <div className="space-y-5 pt-1 pb-6 animate-fade-in">
      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={{}}
        onApply={() => {
          navigate('/search');
        }}
      />

      {/* Edit Name Modal */}
      {showEditNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Your Full Name</h3>
              <button
                onClick={() => setShowEditNameModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveName} className="space-y-3">
              <input
                type="text"
                placeholder="Enter your name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 focus:border-[#008080] focus:outline-none"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditNameModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingName || !nameInput.trim()}
                  className="flex-1 rounded-xl bg-[#008080] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#006b6b] disabled:opacity-50"
                >
                  {savingName ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Invite / QR Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-[#008080]" />
                <h3 className="text-sm font-bold text-gray-900">Join PG Stay</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Enter the 6-character PG property code or invite code provided by your PG manager.
            </p>

            <form onSubmit={handleManualLink} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. PG-8821"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                autoFocus
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:border-[#008080] focus:outline-none uppercase tracking-widest text-center"
              />

              {linkError && (
                <p className="text-xs font-semibold text-red-500 text-center">{linkError}</p>
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
                  {linking ? 'Checking...' : 'Link Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Top Header Row (Matches Screenshot 2) */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-xs font-medium text-gray-500">Welcome to PGs,</p>
          <button
            type="button"
            onClick={() => {
              setNameInput(tenant?.name || '');
              setShowEditNameModal(true);
            }}
            className="flex items-center gap-1.5 text-base font-black text-[#008080] tracking-tight hover:underline text-left mt-0.5"
          >
            <span>{displayName}</span>
            <Pencil className="h-3.5 w-3.5 text-[#008080]" />
          </button>
        </div>

        {/* Right Actions: Avatar Story Ring + Notification Bell with Red Dot */}
        <div className="flex items-center gap-2.5">
          <div
            onClick={() => navigate('/profile')}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-primary/40 bg-teal-50 text-xs font-bold text-primary shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            {tenant?.name
              ? tenant.name.slice(0, 2).toUpperCase()
              : 'PG'}
          </div>

          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-600 shadow-sm hover:bg-gray-50 active:scale-95 transition-all tap-target"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
        </div>
      </div>

      {/* Linked PG Active Banner (if user already linked) */}
      {isLinkedTenant && (
        <div
          onClick={() => navigate('/my-pg')}
          className="cursor-pointer rounded-2xl bg-gradient-to-r from-[#008080] to-[#005f5f] p-4 text-white shadow-md shadow-[#008080]/15 flex items-center justify-between active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200">
                Your Active PG
              </span>
              <h4 className="text-sm font-bold text-white truncate max-w-[200px]">
                {propertyDetails?.property?.name || 'Linked PG Stay'}
              </h4>
              <p className="text-[11px] text-white/80">
                {propertyDetails?.room?.roomNumber ? `Room ${propertyDetails.room.roomNumber}` : 'Room Assigned'}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/80" />
        </div>
      )}

      {/* 2. "Join your PG" Card (Matches Screenshot 2) */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm text-center space-y-4">
        {/* Teal Square with White Plus Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#008080] text-white shadow-md shadow-[#008080]/20">
          <Plus className="h-7 w-7 stroke-[2.5]" />
        </div>

        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900">
            Join your PG
          </h2>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
            Scan the QR code provided by your PG owner to join your PG
          </p>
        </div>

        {/* Scan QR Primary Button */}
        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              navigate('/login', { state: { from: { pathname: '/' } } });
            } else {
              setShowInviteModal(true);
            }
          }}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#008080] py-3.5 text-xs font-bold text-white shadow-md shadow-[#008080]/20 hover:bg-[#006b6b] active:scale-[0.98] transition-all tap-target"
        >
          <QrCode className="h-4 w-4" />
          <span>Scan QR</span>
        </button>

        {/* Enter Invite Code / Link Manually Action */}
        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              navigate('/login', { state: { from: { pathname: '/' } } });
            } else {
              setShowInviteModal(true);
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#008080] hover:underline"
        >
          <Keyboard className="h-3.5 w-3.5" />
          <span>Enter Invite Code / Link Manually</span>
        </button>
      </div>

      {/* 3. Search Bar with Filter Button (Matches Screenshot 2) */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#008080]" />
          <input
            type="text"
            placeholder="Search location (e.g. Indirapuram, Delhi) or..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:border-[#008080] focus:outline-none transition-all shadow-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-[#008080] hover:text-[#008080] active:scale-95 transition-all tap-target"
          title="Open Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </form>

      {/* 4. "Recent Saved" Section (Matches Screenshot 2) */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
          Recent Saved
        </h3>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-[#008080] flex-shrink-0">
            <Bookmark className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">No Saved PGs yet</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Tap the bookmark icon on any PG to view it here
            </p>
          </div>
        </div>
      </div>

      {/* 5. "Nearby PGs" Section (Matches Screenshot 2) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">
            Nearby PGs
          </h3>
          <button
            onClick={() => navigate('/search')}
            className="text-xs font-bold text-[#008080] hover:underline flex items-center gap-0.5"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {loadingNearby ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-[#008080] mb-2" />
            <p className="text-xs font-semibold text-gray-400">Loading nearby properties...</p>
          </div>
        ) : nearbyPgs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center space-y-2">
            <Building2 className="mx-auto h-8 w-8 text-gray-300" />
            <p className="text-xs font-semibold text-gray-500">
              No verified PGs found in immediate area.
            </p>
            <button
              onClick={() => navigate('/search')}
              className="text-xs font-bold text-[#008080] hover:underline"
            >
              Explore all locations
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {nearbyPgs.slice(0, 5).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
