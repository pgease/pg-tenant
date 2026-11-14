import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Bell,
  Pencil,
  X,
  Building2,
  ChevronRight,
  ArrowRight,
  UtensilsCrossed,
  CreditCard,
  Wifi,
  Sparkles,
  Moon,
  Users,
  Wrench,
  BellRing,
  MapPin,
  CheckCircle2,
  AlertCircle,
  DoorOpen,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { tenantService, type RentCollectionDetails } from '../services/tenantService';
import { PgExplorerSection } from '../components/search/PgExplorerSection';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export const HomePage: React.FC = () => {
  const {
    isAuthenticated,
    isLinkedTenant,
    propertyDetails,
    checkTenancy,
    tenant,
    logout,
  } = useAuth();
  const navigate = useNavigate();

  // Edit Name Modal State
  const [showEditNameModal, setShowEditNameModal] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(tenant?.name || '');
  const [savingName, setSavingName] = useState<boolean>(false);

  // Live resident widgets data
  const [todayDining, setTodayDining] = useState<any>(null);
  const [rentDues, setRentDues] = useState<RentCollectionDetails | null>(null);
  const [hasUnreadNotices, setHasUnreadNotices] = useState<boolean>(false);
  const [pendingAgreement, setPendingAgreement] = useState<any | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      tenantService
        .getNotices()
        .then((list) => {
          setHasUnreadNotices(Array.isArray(list) && list.length > 0);
        })
        .catch(() => setHasUnreadNotices(false));

      tenantService
        .getAgreements()
        .then((agrs) => {
          const ready = (agrs || []).find((a: any) => {
            const st = (a.status || '').toUpperCase();
            return (st === 'SENT' || st === 'READY_TO_SIGN' || st === 'PENDING') && Boolean(a.signUrl || a.signingUrl);
          });
          if (ready) setPendingAgreement(ready);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLinkedTenant) {
      // 1. Fetch Today's Dining Menu
      tenantService
        .getDiningSchedule()
        .then((res) => {
          const rawList = Array.isArray(res?.schedule)
            ? res.schedule
            : Array.isArray(res)
            ? res
            : [];
          const todayDayOfWeek = new Date().getDay();
          const found = rawList.find((item: any) => Number(item.dayOfWeek) === todayDayOfWeek);
          if (found) setTodayDining(found);
        })
        .catch(() => {});

      // 2. Fetch Rent & Dues status
      tenantService
        .getRentDues()
        .then((dues) => {
          if (dues) setRentDues(dues);
        })
        .catch(() => {});
    }
  }, [isLinkedTenant]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      await authService.updateProfile({ name: nameInput.trim() });
      await checkTenancy();
      setShowEditNameModal(false);
    } catch (err) {
      console.error('Failed to update name:', err);
    } finally {
      setSavingName(false);
    }
  };

  const displayName = tenant?.name || (isAuthenticated ? 'Resident' : 'Explore PGs');
  const greeting = getTimeGreeting();

  // Authenticated tenant who is NOT linked to an active PG property yet (TW-01)
  if (isAuthenticated && !isLinkedTenant) {
    const maskedMobile = tenant?.phone
      ? `${tenant.phone.slice(0, 2)}XXXXX${tenant.phone.slice(-3)}`
      : 'your registered number';

    return (
      <div className="space-y-4 pt-1 pb-6 animate-fade-in text-center">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs font-medium text-gray-500">Welcome to PG Ease,</p>
            <p className="text-base font-black text-[#008080] tracking-tight text-left mt-0.5">
              {displayName}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Unlinked Notice Card (TW-01) */}
        <div className="rounded-3xl border border-amber-200/80 bg-amber-50/40 p-6 shadow-sm space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Building2 className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-black text-gray-900">You're not linked to a PG yet</h2>
            <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
              If your PG owner added you, ask them to check your mobile number ({maskedMobile}). Once added by the manager, your room details and rent sheet will appear here automatically.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={() => checkTenancy()}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#008080] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#006b6b] active:scale-95 transition-all"
            >
              <span>Refresh Stay Status</span>
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-3 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <span>Log out</span>
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="text-xs font-bold text-[#008080] hover:underline"
          >
            Or browse available verified PGs & Hostels →
          </button>
        </div>
      </div>
    );
  }

  // If visitor is NOT authenticated -> Show the full PG Discovery & Search Portal
  if (!isLinkedTenant) {
    return (
      <div className="space-y-4 pt-1 pb-6 animate-fade-in">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs font-medium text-gray-500">Welcome to PG Ease,</p>
            <button
              type="button"
              onClick={() => {
                if (isAuthenticated) {
                  setNameInput(tenant?.name || '');
                  setShowEditNameModal(true);
                } else {
                  navigate('/login');
                }
              }}
              className="flex items-center gap-1.5 text-base font-black text-[#008080] tracking-tight hover:underline text-left mt-0.5"
            >
              <span>{displayName}</span>
              {isAuthenticated && <Pencil className="h-3.5 w-3.5 text-[#008080]" />}
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-primary/40 bg-teal-50 text-xs font-bold text-[#008080] shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              {tenant?.name ? tenant.name.slice(0, 2).toUpperCase() : 'PG'}
            </div>
          </div>
        </div>

        {/* Hero Mascot Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#008080] via-[#006666] to-[#004D4D] p-5 text-white shadow-xl shadow-[#008080]/20">
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex-1 space-y-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-teal-100 backdrop-blur-md">
                <Sparkles className="h-3 w-3" />
                <span>Zero Brokerage Stays</span>
              </span>
              <h2 className="text-lg font-black tracking-tight leading-snug">
                Find Your Perfect PG & Hostel
              </h2>
              <p className="text-xs text-white/80 leading-relaxed line-clamp-2">
                Verified amenities, daily meals, fast Wi-Fi, and instant owner connect across India.
              </p>
              <button
                onClick={() => navigate('/search')}
                className="inline-flex items-center gap-1 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-[#008080] shadow-md hover:bg-gray-50 active:scale-95 transition-all"
              >
                <span>Explore Verified PGs</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-shrink-0 w-24 h-28 relative">
              <img
                src="/assets/mascot.jpg"
                alt="PG Ease Mascot"
                className="w-full h-full object-contain rounded-2xl filter drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Full Explorer Section */}
        <PgExplorerSection />
      </div>
    );
  }

  // ACTIVE RESIDENT DASHBOARD (When linked to a PG like "Shivam 6 pg")
  const propertyName = propertyDetails?.property?.name || 'Active PG Stay';
  const roomNum = propertyDetails?.room?.roomNumber || propertyDetails?.room?.name;
  const bedNum =
    propertyDetails?.bed?.bedNumber ||
    (propertyDetails?.bed as any)?.label ||
    propertyDetails?.roomTenant?.bedNumberOnAssignment ||
    (propertyDetails as any)?.bedNumber;
  const roomAndBedLabel = roomNum
    ? `Room ${roomNum}${bedNum ? ` · Bed ${bedNum}` : ''}`
    : 'Room Assigned';
  const monthlyRent = propertyDetails?.roomTenant?.monthlyRent ?? 0;
  const totalPayable = rentDues?.totalPayable ?? (rentDues as any)?.payable ?? rentDues?.summary?.balanceDue ?? 0;
  const duesStatus = (rentDues?.status || (totalPayable > 0 ? 'DUE' : 'UP_TO_DATE')).toUpperCase();
  const nextDueDateVal = (rentDues as any)?.nextDueDate;
  const nextDueText = nextDueDateVal
    ? new Date(nextDueDateVal).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '';

  return (
    <div className="space-y-4 pt-1 pb-6 animate-fade-in">
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
              <p className="text-[11px] text-gray-400">Your PG owner will see this change</p>
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

      {/* 1. Header: Greeting & Profile Actions */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-xs font-medium text-gray-500">{greeting}</p>
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

        {/* Right Actions: Avatar + Notification Bell */}
        <div className="flex items-center gap-2.5">
          <div
            onClick={() => navigate('/profile')}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-primary/40 bg-teal-50 text-xs font-bold text-[#008080] shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            {tenant?.name ? tenant.name.slice(0, 2).toUpperCase() : 'SH'}
          </div>

          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-600 shadow-sm hover:bg-gray-50 active:scale-95 transition-all tap-target"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {hasUnreadNotices && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Hero Active Stay Card (Clean, modern, premium single card) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#006666] via-[#004d4d] to-[#003333] p-5 text-white shadow-xl shadow-teal-900/15">
        {/* Soft Decorative Accents */}
        <div className="absolute -right-8 -bottom-8 h-36 w-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        {/* Top Tag: Active Resident */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active Resident
          </span>

          {duesStatus === 'OVERDUE' || (totalPayable > 0 && duesStatus !== 'ADVANCE') ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-300/30 px-2 py-0.5 text-[10px] font-bold text-amber-200">
              <AlertCircle className="h-3 w-3" />
              <span>₹{totalPayable.toLocaleString('en-IN')} {duesStatus === 'OVERDUE' ? 'Overdue' : nextDueText ? `Due ${nextDueText}` : 'Due'}</span>
            </span>
          ) : duesStatus === 'ADVANCE' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
              <CheckCircle2 className="h-3 w-3 text-emerald-300" />
              <span>Advance Credit</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-teal-200">
              <CheckCircle2 className="h-3 w-3 text-teal-300" />
              <span>Rent Up to Date</span>
            </span>
          )}
        </div>

        {/* Property Name & Room */}
        <div className="space-y-1 mt-3">
          <h2 className="text-xl font-black tracking-tight text-white">
            {propertyName}
          </h2>
          <p className="text-xs text-teal-100/80 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-300" />
            <span className="truncate">
              {propertyDetails?.property?.address || propertyDetails?.property?.cityName || 'Registered Stay'}
            </span>
          </p>
        </div>

        {/* Room & Rent Details Chips */}
        <div className="flex items-center gap-2 pt-3 flex-wrap">
          <div className="rounded-xl bg-white/10 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white border border-white/10 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-teal-300" />
            <span>{roomAndBedLabel}</span>
          </div>

          {monthlyRent > 0 && (
            <div className="rounded-xl bg-white/10 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white border border-white/10 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-teal-300" />
              <span>₹{monthlyRent.toLocaleString('en-IN')}/mo</span>
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => navigate('/my-pg')}
            className="text-xs font-bold text-teal-200 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>View Stay Details</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => navigate('/payments')}
            className="rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-teal-900 shadow-sm hover:bg-teal-50 active:scale-95 transition-all"
          >
            {totalPayable > 0 ? 'Pay Now' : 'View Ledger'}
          </button>
        </div>
      </div>

      {/* Pending Agreement Action Banner (TW-14) */}
      {pendingAgreement && (
        <div
          onClick={() => navigate('/documents')}
          className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition-all shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950">Rent Agreement Ready to Sign</p>
              <p className="text-[11px] text-amber-800">Your PG owner generated your agreement. Review & e-Sign digitally.</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-900 bg-white/90 border border-amber-200 px-2.5 py-1 rounded-lg shrink-0">
            Sign →
          </span>
        </div>
      )}

      {/* 3. Daily Living Essentials (Clean 6-Grid Quick Action Tiles) */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 pl-0.5">
          Resident Services
        </h3>

        <div className="grid grid-cols-3 gap-2.5">
          {/* 1. Food Menu */}
          <button
            onClick={() => navigate('/food')}
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-xs hover:border-amber-200 hover:bg-amber-50/20 active:scale-95 transition-all group tap-target"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs font-bold text-gray-800">Food Menu</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Weekly Schedule</span>
          </button>

          {/* 2. Night Out */}
          <button
            onClick={() => navigate('/night-out')}
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-xs hover:border-indigo-200 hover:bg-indigo-50/20 active:scale-95 transition-all group tap-target"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
              <Moon className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs font-bold text-gray-800">Night Out</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Overnight Leave</span>
          </button>

          {/* 3. Guest Entry */}
          <button
            onClick={() => navigate('/guests')}
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-xs hover:border-teal-200 hover:bg-teal-50/20 active:scale-95 transition-all group tap-target"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs font-bold text-gray-800">Guest Pass</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Visitor Check-in</span>
          </button>

          {/* 4. Complaints */}
          <button
            onClick={() => navigate('/complaints')}
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-xs hover:border-rose-200 hover:bg-rose-50/20 active:scale-95 transition-all group tap-target"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs font-bold text-gray-800">Complaints</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Repairs & Help</span>
          </button>

          {/* 5. Wi-Fi */}
          <button
            onClick={() => navigate('/wifi')}
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-xs hover:border-blue-200 hover:bg-blue-50/20 active:scale-95 transition-all group tap-target"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
              <Wifi className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs font-bold text-gray-800">PG Wi-Fi</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Pass & Network</span>
          </button>

          {/* 6. Notices / Announcements */}
          <button
            onClick={() => navigate('/announcements')}
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-xs hover:border-purple-200 hover:bg-purple-50/20 active:scale-95 transition-all group tap-target"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform">
              <BellRing className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs font-bold text-gray-800">Notice Board</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Announcements</span>
          </button>

          {/* 7. Notice Period / Move Out */}
          <button
            onClick={() => navigate('/notice')}
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-xs hover:border-amber-200 hover:bg-amber-50/20 active:scale-95 transition-all group tap-target"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 group-hover:scale-105 transition-transform">
              <DoorOpen className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs font-bold text-gray-800">Notice Period</span>
            <span className="text-[10px] text-gray-400 mt-0.5">I'm Leaving</span>
          </button>
        </div>
      </div>

      {/* 4. Today's Mess Live Preview Widget */}
      {todayDining && (todayDining.lunch?.menu || todayDining.dinner?.menu) ? (
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-500/5 via-white to-white p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-amber-600" />
              <h4 className="text-xs font-bold text-gray-900">Today's Mess Highlights</h4>
            </div>
            <button
              onClick={() => navigate('/food')}
              className="text-[11px] font-bold text-[#008080] hover:underline flex items-center gap-0.5"
            >
              <span>Full Menu</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {todayDining.lunch?.menu ? (
              <div className="rounded-xl bg-white p-2.5 border border-gray-100 space-y-0.5 shadow-2xs">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                  Lunch
                </span>
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {todayDining.lunch.menu}
                </p>
                {todayDining.lunch.startTime && (
                  <span className="text-[10px] text-gray-400 block pt-0.5">
                    {todayDining.lunch.startTime} – {todayDining.lunch.endTime || ''}
                  </span>
                )}
              </div>
            ) : null}

            {todayDining.dinner?.menu ? (
              <div className="rounded-xl bg-white p-2.5 border border-gray-100 space-y-0.5 shadow-2xs">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                  Dinner
                </span>
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {todayDining.dinner.menu}
                </p>
                {todayDining.dinner.startTime && (
                  <span className="text-[10px] text-gray-400 block pt-0.5">
                    {todayDining.dinner.startTime} – {todayDining.dinner.endTime || ''}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* 5. Sleek Exploration Banner for Relocating */}
      <div
        onClick={() => navigate('/search')}
        className="cursor-pointer rounded-2xl border border-gray-100 bg-gradient-to-r from-gray-50 via-teal-50/40 to-white p-4 shadow-xs flex items-center justify-between hover:border-teal-200 transition-all active:scale-[0.99] tap-target"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#008080]/10 text-[#008080] shrink-0">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">Relocating to another city?</h4>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Explore 5,000+ verified PGs & hostels with Zero Brokerage
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-[#008080] shrink-0" />
      </div>
    </div>
  );
};
