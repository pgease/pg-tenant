import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard,
  Utensils,
  MessageSquareWarning,
  Users,
  Calendar,
  ShieldCheck,
  Wifi,
  FileText,
  MapPin,
  Check,
  Sparkles,
  RefreshCw,
  Phone,
  UserCheck,
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { tenantService, type RentCollectionDetails } from '../services/tenantService';
import { AmenitiesModal } from '../components/my-pg/AmenitiesModal';
import { PgExplorerSection } from '../components/search/PgExplorerSection';

export const HomePage: React.FC = () => {
  const {
    isLinkedTenant,
    propertyDetails,
    checkTenancy,
    isCheckingTenancy,
    isAuthenticated,
    tenant,
  } = useAuth();
  const navigate = useNavigate();

  // Dues & Recent Activity State
  const [duesData, setDuesData] = useState<RentCollectionDetails | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Unauthenticated visitors should never be on HomePage -> direct to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    if (isAuthenticated && isLinkedTenant) {
      tenantService
        .getRentDues()
        .then((res) => setDuesData(res))
        .catch(() => {});

      tenantService
        .getRentHistory(1, 5)
        .then((res) => {
          const list = res.transactions || res.history || (Array.isArray(res) ? res : []);
          setRecentTransactions(list);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, isLinkedTenant]);

  // Derived Dynamic Data for Linked PG
  const propertyName = propertyDetails?.property?.name || 'Active PG Stay';
  const propertyAddress = propertyDetails?.property?.address || propertyDetails?.property?.cityName || '';
  const roomNumber = propertyDetails?.room?.roomNumber ? `Room ${propertyDetails.room.roomNumber}` : '';
  const amountDue = duesData?.totalPayable ?? propertyDetails?.roomTenant?.monthlyRent ?? 0;
  const isPaid = duesData?.status === 'paid' || (amountDue === 0 && Boolean(propertyDetails));

  const formatDueDate = () => {
    if (propertyDetails?.nextRentDueDate) {
      return `Due by ${new Date(propertyDetails.nextRentDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
    }
    if (duesData?.lineItems?.rent?.dueDay) {
      return `Due on ${duesData.lineItems.rent.dueDay} of month`;
    }
    return 'Due on 1st of month';
  };

  return (
    <div className="space-y-5 pt-1 pb-6 animate-fade-in">
      {/* House Rules & Security Modal */}
      <AmenitiesModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        amenities={propertyDetails?.amenities}
        facilities={propertyDetails?.facilities}
        restrictions={propertyDetails?.restrictions}
      />

      {/* 1. Header Greeting & Logged-In User Details */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <span>Welcome back,</span>
            {tenant?.phone && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-primary">
                <Phone className="h-2.5 w-2.5" />
                <span>+91 {tenant.phone}</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-brandText tracking-tight mt-0.5">
            {tenant?.name || 'Resident'}
          </h1>
        </div>

        {/* Sync Button to refresh tenancy linkage */}
        <button
          onClick={() => checkTenancy()}
          disabled={isCheckingTenancy}
          className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 disabled:opacity-50 transition-all tap-target"
          title="Sync stay with PG Manager"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isCheckingTenancy ? 'animate-spin text-primary' : 'text-gray-500'}`} />
          <span>{isCheckingTenancy ? 'Syncing...' : 'Sync'}</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SCENARIO A: Tenant is LINKED to an active PG -> Show PG Details    */}
      {/* ------------------------------------------------------------------ */}
      {isLinkedTenant ? (
        <>
          {/* Main Stay Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-600 to-primary-dark p-5 text-white shadow-xl shadow-primary/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold backdrop-blur-md">
                <UserCheck className="h-3 w-3" />
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

            {/* Inner Card for Rent Due */}
            <div className="rounded-2xl bg-white p-4 text-brandText shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-gray-500">
                  {isPaid ? 'Rent Status' : 'Rent Due'}
                </span>
                <p className="text-lg font-black text-brandText">
                  ₹{amountDue.toLocaleString('en-IN')}
                </p>
                <p className={`text-[11px] font-semibold ${isPaid ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPaid ? 'Paid for current cycle' : formatDueDate()}
                </p>
              </div>

              <button
                onClick={() => navigate('/payments')}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark active:scale-95 transition-all tap-target"
              >
                {isPaid ? 'View Passbook' : 'Pay Now'}
              </button>
            </div>
          </div>

          {/* Quick Actions 4x2 Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-brandText uppercase tracking-wider px-1">
              Quick Actions
            </h3>

            <div className="grid grid-cols-4 gap-2.5">
              {/* 1. Pay Rent */}
              <button
                onClick={() => navigate('/payments')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-card-soft hover:border-teal-200 active:scale-95 transition-all tap-target"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-1.5">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-brandText text-center">Pay Rent</span>
              </button>

              {/* 2. Food */}
              <button
                onClick={() => navigate('/food')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-card-soft hover:border-orange-200 active:scale-95 transition-all tap-target"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 mb-1.5">
                  <Utensils className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-brandText text-center">Food</span>
              </button>

              {/* 3. Complaints */}
              <button
                onClick={() => navigate('/complaints')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-card-soft hover:border-red-200 active:scale-95 transition-all tap-target"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500 mb-1.5">
                  <MessageSquareWarning className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-brandText text-center">Complaints</span>
              </button>

              {/* 4. Guests */}
              <button
                onClick={() => navigate('/guests')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-card-soft hover:border-blue-200 active:scale-95 transition-all tap-target"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-1.5">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-brandText text-center">Guests</span>
              </button>

              {/* 5. Notice */}
              <button
                onClick={() => navigate('/notice')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-card-soft hover:border-purple-200 active:scale-95 transition-all tap-target"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-1.5">
                  <Calendar className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-brandText text-center">Notice</span>
              </button>

              {/* 6. Security & House Rules */}
              <button
                onClick={() => setShowSecurityModal(true)}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-card-soft hover:border-emerald-200 active:scale-95 transition-all tap-target"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-1.5">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-brandText text-center">Security</span>
              </button>

              {/* 7. WiFi */}
              <button
                onClick={() => navigate('/wifi')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-card-soft hover:border-teal-200 active:scale-95 transition-all tap-target"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-1.5">
                  <Wifi className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-brandText text-center">WiFi</span>
              </button>

              {/* 8. Documents */}
              <button
                onClick={() => navigate('/documents')}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-card-soft hover:border-indigo-200 active:scale-95 transition-all tap-target"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-1.5">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-brandText text-center">Documents</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-brandText uppercase tracking-wider">
                Recent Activity
              </h3>
              {recentTransactions.length > 0 && (
                <button
                  onClick={() => navigate('/transactions')}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  View All
                </button>
              )}
            </div>

            {recentTransactions.length > 0 ? (
              <div className="space-y-2.5">
                {recentTransactions.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate('/transactions')}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-card-soft cursor-pointer hover:border-gray-200 active:scale-99 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brandText flex items-center gap-1">
                          <span>{item.title || 'Rent Paid'}</span>
                          <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          {item.formattedDate || (item.date ? new Date(item.date).toLocaleDateString('en-IN') : 'Recent')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-brandText">₹{Number(item.amount).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-emerald-600 font-bold">{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-xs text-gray-400">
                No recent payments or actions recorded. Your monthly dues and receipts will show here.
              </div>
            )}
          </div>
        </>
      ) : (
        /* ------------------------------------------------------------------ */
        /* SCENARIO B: Tenant NOT linked to any PG -> Show PG Section         */
        /* ------------------------------------------------------------------ */
        <div className="space-y-5">
          {/* Tenant Status Info Card */}
          <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                <h3 className="text-sm font-bold text-brandText">No Active PG Assigned</h3>
              </div>
              <span className="rounded-full bg-teal-100/80 px-2.5 py-0.5 text-[10px] font-bold text-teal-800">
                Looking for PG
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Your mobile number (<strong>+91 {tenant?.phone}</strong>) is not yet assigned to a room by a PG manager.
              Looking for a stay? Explore verified PGs below. If your PG manager already added you, tap <strong>Sync</strong> to refresh.
            </p>

            <div className="pt-1 flex gap-2">
              <button
                onClick={() => checkTenancy()}
                disabled={isCheckingTenancy}
                className="flex-1 rounded-xl border border-teal-200 bg-white py-2.5 text-xs font-bold text-primary hover:bg-teal-50 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isCheckingTenancy ? 'animate-spin' : ''}`} />
                <span>{isCheckingTenancy ? 'Checking Status...' : 'Check Status'}</span>
              </button>
            </div>
          </div>

          {/* The PG Section (Explore & Search PGs) */}
          <div className="border-t border-gray-100 pt-3">
            <PgExplorerSection
              title="Find & Explore PGs"
              subtitle="Browse verified stays with zero brokerage & direct owner connect"
            />
          </div>
        </div>
      )}
    </div>
  );
};
