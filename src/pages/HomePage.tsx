import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Pencil,
  X,
  Building2,
  ChevronRight,
  ArrowRight,
  UtensilsCrossed,
  CreditCard,
  Wrench,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileSignature,
  IndianRupee,
  Clock,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { tenantService, type RentCollectionDetails } from '../services/tenantService';
import { PgExplorerSection } from '../components/search/PgExplorerSection';
import { RentPaymentModal } from '../components/my-pg/RentPaymentModal';

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
  const [agreements, setAgreements] = useState<any[]>([]);
  const [kycData, setKycData] = useState<any | null>(null);
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  const loadData = async () => {
    setLoadingData(true);
    try {
      if (isAuthenticated) {
        const [noticesRes, agreementsRes, kycRes] = await Promise.allSettled([
          tenantService.getNotices(),
          tenantService.getAgreements(),
          tenantService.getKycStatus(),
        ]);

        if (noticesRes.status === 'fulfilled') {
          setHasUnreadNotices(Array.isArray(noticesRes.value) && noticesRes.value.length > 0);
        }
        if (agreementsRes.status === 'fulfilled') {
          setAgreements(Array.isArray(agreementsRes.value) ? agreementsRes.value : []);
        }
        if (kycRes.status === 'fulfilled') {
          setKycData(kycRes.value);
        }
      }

      if (isLinkedTenant) {
        const [diningRes, duesRes] = await Promise.allSettled([
          tenantService.getDiningSchedule(),
          tenantService.getRentDues(),
        ]);

        if (diningRes.status === 'fulfilled') {
          const rawList = Array.isArray(diningRes.value?.schedule)
            ? diningRes.value.schedule
            : Array.isArray(diningRes.value)
            ? diningRes.value
            : [];
          const todayDayOfWeek = new Date().getDay();
          const found = rawList.find((item: any) => Number(item.dayOfWeek) === todayDayOfWeek);
          if (found) setTodayDining(found);
        }

        if (duesRes.status === 'fulfilled' && duesRes.value) {
          setRentDues(duesRes.value);
        }
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated, isLinkedTenant]);

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

  const rawPhoto =
    tenant?.profilePhotoUrl ||
    tenant?.photoUrl ||
    tenant?.avatarUrl ||
    tenant?.kycInfo?.photoUrl ||
    propertyDetails?.tenant?.profilePhotoUrl ||
    propertyDetails?.tenant?.photoUrl ||
    '';
  const tenantPhoto = typeof rawPhoto === 'string' && rawPhoto.trim() ? rawPhoto.trim() : '';
  const tenantInitials = (tenant?.name || displayName || 'R')
    .trim()
    .slice(0, 2)
    .toUpperCase();

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
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#008080] text-xs font-bold text-white shadow-sm hover:opacity-90 overflow-hidden ring-2 ring-white"
                aria-label="Profile"
              >
                {tenantPhoto ? (
                  <img src={tenantPhoto} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  tenantInitials
                )}
                {hasUnreadNotices && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="rounded-xl bg-[#008080] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#006b6b]"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Discovery Hero Banner (Clean, mascot-free) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#006666] via-[#004d4d] to-[#003333] p-5 text-white shadow-xl shadow-teal-900/15">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                PG Ease Verified Stays
              </span>
              <h2 className="text-lg font-black tracking-tight leading-snug">
                Find Your Perfect PG & Hostel
              </h2>
              <p className="text-xs text-white/80 leading-relaxed">
                Zero brokerage, verified amenities & direct PG owner connect.
              </p>
              <button
                onClick={() => navigate('/search')}
                className="mt-2 inline-flex items-center gap-1 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-[#008080] shadow-md hover:bg-gray-50 active:scale-95 transition-all"
              >
                <span>Explore Verified PGs</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 border border-white/20 text-white backdrop-blur-md">
              <Building2 className="w-10 h-10 text-teal-200" />
            </div>
          </div>
        </div>

        {/* Full Explorer Section */}
        <PgExplorerSection />
      </div>
    );
  }

  // ACTIVE RESIDENT DASHBOARD
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

  const moveInDateRaw =
    propertyDetails?.roomTenant?.checkInDate ||
    (propertyDetails as any)?.moveInDate ||
    propertyDetails?.roomTenant?.startDate;
  const moveInDateFormatted = moveInDateRaw
    ? new Date(moveInDateRaw).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const balanceDue = rentDues?.summary?.balanceDue !== undefined
    ? Number(rentDues.summary.balanceDue)
    : rentDues?.summary?.totalPayable !== undefined
    ? Number(rentDues.summary.totalPayable)
    : rentDues?.payable !== undefined
    ? Number(rentDues.payable)
    : Number(rentDues?.totalPayable || 0);

  const duesStatus = (rentDues?.status || (balanceDue > 0 ? 'DUE' : 'UP_TO_DATE')).toUpperCase();
  const nextDueDateVal = (rentDues as any)?.nextDueDate;
  const nextDueText = nextDueDateVal
    ? new Date(nextDueDateVal).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '';

  const monthlyRent = Number(
    rentDues?.lineItems?.rent?.amount ??
    propertyDetails?.roomTenant?.rentAmount ??
    (propertyDetails?.roomTenant as any)?.monthlyRent ??
    propertyDetails?.room?.monthlyRent ??
    0
  );

  const isRentPaid = Boolean(
    rentDues?.lineItems?.rent?.isPaid ||
    (rentDues?.summary?.rentDue === 0 && (rentDues?.summary?.amountPaid ?? 0) > 0)
  );

  const securityDepositAmount = Number(
    rentDues?.lineItems?.securityDeposit?.amount ??
    propertyDetails?.roomTenant?.securityDeposit ??
    (propertyDetails?.roomTenant as any)?.depositAmount ??
    propertyDetails?.room?.securityDeposit ??
    0
  );

  const isSecurityPaid = Boolean(
    rentDues?.lineItems?.securityDeposit?.isPaid ||
    (propertyDetails?.roomTenant as any)?.securityDepositPaid ||
    (propertyDetails?.roomTenant as any)?.isSecurityDepositPaid ||
    (propertyDetails?.roomTenant as any)?.depositPaid
  );

  const otherDuesList = rentDues?.lineItems?.miscellaneous?.otherDues || [];

  // KYC Status
  const rawKycStatus = (kycData?.status || '').toUpperCase();
  const isKycVerified = Boolean(
    kycData?.isKycVerified ||
    rawKycStatus === 'VERIFIED' ||
    rawKycStatus === 'COMPLETED' ||
    tenant?.isKycVerified
  );

  // Agreement Status
  const signedAgreement = (agreements || []).find((a: any) => {
    const st = (a.status || '').toUpperCase();
    return st === 'SIGNED' || st === 'COMPLETED' || a.isSigned;
  });
  const readyToSignAgreement = (agreements || []).find((a: any) => {
    const st = (a.status || '').toUpperCase();
    return (st === 'SENT' || st === 'READY_TO_SIGN' || st === 'PENDING') && Boolean(a.signUrl || a.signingUrl);
  });
  const isAgreementSigned = Boolean(signedAgreement);

  return (
    <div className="space-y-4 pt-1 pb-6 animate-fade-in">
      {/* Header: Greeting & Profile Avatar (T2) */}
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

        {/* Top bar avatar (T2: small 36dp circle with photo or initials on #008080) */}
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#008080] text-xs font-bold text-white shadow-sm hover:opacity-90 overflow-hidden ring-2 ring-white cursor-pointer"
          aria-label="Menu"
        >
          {tenantPhoto ? (
            <img src={tenantPhoto} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            tenantInitials
          )}
          {hasUnreadNotices && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>
      </div>

      {loadingData ? (
        /* Zero Layout Shift Skeletons (T3) */
        <div className="space-y-4">
          <div className="h-44 w-full rounded-3xl bg-slate-200/70 animate-pulse" />
          <div className="h-36 w-full rounded-3xl bg-slate-200/70 animate-pulse" />
          <div className="h-32 w-full rounded-2xl bg-slate-200/70 animate-pulse" />
          <div className="h-32 w-full rounded-2xl bg-slate-200/70 animate-pulse" />
        </div>
      ) : (
        <>
          {/* ================================================================ */}
          {/* SECTION 1: STAY CARD (T3 Fixed Order)                            */}
          {/* ================================================================ */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#006666] via-[#004d4d] to-[#003333] p-5 text-white shadow-xl shadow-teal-900/15">
            <div className="absolute -right-8 -bottom-8 h-36 w-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />

            {/* Top Tag: Active Resident */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Resident
              </span>

              {duesStatus === 'OVERDUE' || (balanceDue > 0 && duesStatus !== 'ADVANCE') ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-300/30 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                  <AlertCircle className="h-3 w-3" />
                  <span>₹{balanceDue.toLocaleString('en-IN')} {duesStatus === 'OVERDUE' ? 'Overdue' : nextDueText ? `Due ${nextDueText}` : 'Due'}</span>
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
              <h2 className="text-xl font-black tracking-tight text-white truncate">
                {propertyName}
              </h2>
              <p className="text-xs text-teal-100/80 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-300" />
                <span className="truncate">
                  {propertyDetails?.property?.address || propertyDetails?.property?.cityName || 'Registered Stay'}
                </span>
              </p>
            </div>

            {/* Room, Rent, & Move-in Details Chips */}
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

              {moveInDateFormatted && (
                <div className="rounded-xl bg-white/10 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-teal-100 border border-white/10 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-teal-300" />
                  <span>In: {moveInDateFormatted}</span>
                </div>
              )}
            </div>

            {/* Card Footer Actions */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                onClick={() => navigate('/my-pg')}
                className="text-xs font-bold text-teal-200 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>View Stay Details</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => {
                  if (balanceDue > 0) {
                    setShowPayModal(true);
                  } else {
                    navigate('/payments');
                  }
                }}
                className="rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-teal-900 shadow-sm hover:bg-teal-50 active:scale-95 transition-all"
              >
                {balanceDue > 0 ? 'Pay Dues' : 'View Ledger'}
              </button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* SECTION 2: OUTSTANDING DUES CARD (T3 & T5 Fixed Order)           */}
          {/* ================================================================ */}
          {balanceDue > 0 ? (
            <div className="rounded-3xl border border-rose-200/90 bg-gradient-to-br from-rose-50/60 via-white to-amber-50/40 p-4 sm:p-5 shadow-sm space-y-3.5 animate-fade-in">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-rose-100 border border-rose-200/80 flex items-center justify-center text-rose-700 font-bold shrink-0">
                    <IndianRupee className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                      Outstanding Dues
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {duesStatus === 'OVERDUE' ? 'Payment overdue' : nextDueText ? `Due by ${nextDueText}` : 'Payment due'}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-0.5">
                  {duesStatus === 'OVERDUE' ? 'Overdue' : 'Due'}
                </span>
              </div>

              {/* Total Payable Callout with Brand Teal Pay Button (T5) */}
              <div className="bg-white border border-rose-100/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                    Total Payable
                  </span>
                  <span className="text-2xl font-black text-rose-600 tabular-nums">
                    ₹{balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPayModal(true)}
                  className="rounded-xl bg-[#008080] hover:bg-[#006666] text-white font-bold text-xs px-4 py-2.5 shadow-md shadow-[#008080]/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Pay dues now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Up to 3 item rows (T5) */}
              <div className="space-y-1.5 pt-1 text-xs">
                {monthlyRent > 0 && (
                  <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white border border-gray-100">
                    <span className="font-semibold text-gray-800">Monthly Rent</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 tabular-nums">₹{monthlyRent.toLocaleString('en-IN')}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isRentPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                        {isRentPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                )}

                {securityDepositAmount > 0 && !isSecurityPaid && (
                  <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white border border-gray-100">
                    <span className="font-semibold text-gray-800">Security Deposit</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 tabular-nums">₹{securityDepositAmount.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                        Pending
                      </span>
                    </div>
                  </div>
                )}

                {otherDuesList.slice(0, 1).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white border border-gray-100">
                    <span className="font-semibold text-gray-800 truncate">{item.title || item.dueType || 'Extra Fee'}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 tabular-nums">₹{Number(item.amount).toLocaleString('en-IN')}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {item.isPaid ? 'Paid' : 'Due'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* View all link */}
              <div className="pt-0.5 text-right">
                <button
                  type="button"
                  onClick={() => navigate('/payments')}
                  className="text-xs font-bold text-[#008080] hover:underline inline-flex items-center gap-1"
                >
                  <span>View all dues in Payments</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">All Dues Cleared</p>
                  <p className="text-[11px] text-emerald-800">Your stay charges are settled with zero pending balance.</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/payments')}
                className="text-xs font-bold text-emerald-900 hover:underline shrink-0"
              >
                History →
              </button>
            </div>
          )}

          {/* ================================================================ */}
          {/* SECTION 3: RESIDENT SERVICES / QUICK ACTIONS (T3 Fixed Order)    */}
          {/* ================================================================ */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 pl-0.5">
              Resident Services
            </h3>

            <div className="grid grid-cols-4 gap-2">
              {/* 1. Pay Rent */}
              <button
                type="button"
                onClick={() => {
                  if (balanceDue > 0) setShowPayModal(true);
                  else navigate('/payments');
                }}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-xs hover:border-teal-200 hover:bg-teal-50/20 active:scale-95 transition-all group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#008080] group-hover:scale-105 transition-transform">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="mt-1.5 text-xs font-bold text-gray-800 leading-tight">Pay Rent</span>
              </button>

              {/* 2. Raise Complaint */}
              <button
                type="button"
                onClick={() => navigate('/complaints')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-xs hover:border-amber-200 hover:bg-amber-50/20 active:scale-95 transition-all group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                  <Wrench className="h-5 w-5" />
                </div>
                <span className="mt-1.5 text-xs font-bold text-gray-800 leading-tight">Complaint</span>
              </button>

              {/* 3. Food Menu */}
              <button
                type="button"
                onClick={() => navigate('/food')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-xs hover:border-orange-200 hover:bg-orange-50/20 active:scale-95 transition-all group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 group-hover:scale-105 transition-transform">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <span className="mt-1.5 text-xs font-bold text-gray-800 leading-tight">Food Menu</span>
              </button>

              {/* 4. Notice Period */}
              <button
                type="button"
                onClick={() => navigate('/notice')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-xs hover:border-indigo-200 hover:bg-indigo-50/20 active:scale-95 transition-all group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="mt-1.5 text-xs font-bold text-gray-800 leading-tight">Notice</span>
              </button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* SECTION 4: DOCUMENTS & COMPLIANCE (T4 Compact Card)             */}
          {/* ================================================================ */}
          {isKycVerified && isAgreementSigned ? (
            <div
              role="button"
              onClick={() => navigate('/documents')}
              className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 flex items-center justify-between cursor-pointer hover:bg-emerald-100/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">All documents verified</p>
                  <p className="text-[11px] text-emerald-800">Aadhaar DigiLocker & Rental Agreement active</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-emerald-700 shrink-0" />
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#008080]" />
                  <span>Documents & Compliance</span>
                </h3>
                <button
                  onClick={() => navigate('/documents')}
                  className="text-[11px] font-bold text-[#008080] hover:underline"
                >
                  Manage all →
                </button>
              </div>

              <div className="space-y-2">
                {/* Row 1 (56dp): Aadhaar KYC */}
                <div
                  role="button"
                  onClick={() => {
                    if (kycData?.directLink) {
                      window.open(kycData.directLink, '_blank');
                    } else {
                      navigate('/documents');
                    }
                  }}
                  className="flex min-h-[56px] items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 p-2.5 hover:bg-gray-100/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#008080]">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">Aadhaar KYC</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            isKycVerified
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isKycVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        Verify your identity with DigiLocker.
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-[#008080] flex items-center gap-0.5">
                    {isKycVerified ? 'View ›' : 'Verify ›'}
                  </span>
                </div>

                {/* Row 2 (56dp): Rental Agreement */}
                <div
                  role="button"
                  onClick={() => {
                    const signUrl = readyToSignAgreement?.signUrl || readyToSignAgreement?.signingUrl;
                    if (signUrl) {
                      window.open(signUrl, '_blank');
                    } else {
                      navigate('/documents');
                    }
                  }}
                  className="flex min-h-[56px] items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 p-2.5 hover:bg-gray-100/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <FileSignature className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">Rental Agreement</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            isAgreementSigned
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isAgreementSigned ? 'Signed' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {isAgreementSigned ? 'Digital tenancy agreement active.' : 'Digital tenancy lease agreement.'}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-[#008080] flex items-center gap-0.5">
                    {isAgreementSigned ? 'View ›' : 'Sign ›'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Today's Mess Highlights Widget (if available) */}
          {todayDining && (todayDining.lunch?.menu || todayDining.dinner?.menu) ? (
            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-500/5 via-white to-white p-3.5 shadow-xs space-y-2">
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
                  <div className="rounded-xl bg-white p-2 border border-gray-100 space-y-0.5 shadow-2xs">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                      Lunch
                    </span>
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {todayDining.lunch.menu}
                    </p>
                  </div>
                ) : null}

                {todayDining.dinner?.menu ? (
                  <div className="rounded-xl bg-white p-2 border border-gray-100 space-y-0.5 shadow-2xs">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                      Dinner
                    </span>
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {todayDining.dinner.menu}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      )}

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

      {/* Rent Payment Modal */}
      {showPayModal && (
        <RentPaymentModal
          isOpen={showPayModal}
          onClose={() => {
            setShowPayModal(false);
            loadData();
          }}
          dues={rentDues}
          onPaymentSuccess={() => {
            setShowPayModal(false);
            loadData();
          }}
          securityDepositAmount={securityDepositAmount}
          isSecurityPaid={isSecurityPaid}
        />
      )}
    </div>
  );
};
