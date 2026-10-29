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
  LogIn,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenantService, type RentCollectionDetails } from '../services/tenantService';

// Security / House Rules Modal
import { AmenitiesModal } from '../components/my-pg/AmenitiesModal';

export const HomePage: React.FC = () => {
  const { isLinkedTenant, propertyDetails, checkTenancy, isCheckingTenancy, isAuthenticated, tenant } = useAuth();
  const navigate = useNavigate();

  // Dues & Recent Activity State
  const [duesData, setDuesData] = useState<RentCollectionDetails | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

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

  // Derived Dynamic Data
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

      {/* 1. Header Greeting (Dynamic from authenticated tenant) */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">Welcome back,</p>
          <h1 className="text-2xl font-black text-brandText tracking-tight mt-0.5">
            {tenant?.name || (isAuthenticated ? 'Resident' : 'Explorer')}
          </h1>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => checkTenancy()}
            disabled={isCheckingTenancy}
            className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-50 active:scale-95 disabled:opacity-50"
            title="Refresh stay status"
          >
            <RefreshCw className={`h-3 w-3 ${isCheckingTenancy ? 'animate-spin text-primary' : ''}`} />
            <span>Sync</span>
          </button>
        )}
      </div>

      {/* 2. Main Stay Hero Card */}
      {isAuthenticated && isLinkedTenant ? (
        /* Mode A: Active Tenancy Card */
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-600 to-primary-dark p-5 text-white shadow-xl shadow-primary/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold backdrop-blur-md">
              <span>Linked PG</span>
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
      ) : isAuthenticated ? (
        /* Mode B: Logged in but not yet linked by owner */
        <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-brandText">No Active PG Stay Assigned</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Your phone number (+91 {tenant?.phone}) is not yet linked to a room by a PG manager. Once added, your room details, rent receipts, and dining schedule will automatically appear here.
          </p>
          <div className="pt-1 flex gap-2">
            <button
              onClick={() => checkTenancy()}
              disabled={isCheckingTenancy}
              className="flex-1 rounded-xl border border-teal-200 bg-white py-2 text-xs font-bold text-primary hover:bg-teal-50"
            >
              {isCheckingTenancy ? 'Checking...' : 'Check Status'}
            </button>
            <button
              onClick={() => navigate('/search')}
              className="flex-1 rounded-xl bg-primary py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark"
            >
              Explore PGs
            </button>
          </div>
        </div>
      ) : (
        /* Guest / Unauthenticated State */
        <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-brandText">Welcome to PG Ease</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Sign in with your mobile OTP to view your active room stay, pay rent with zero hassle, check meals, and raise maintenance tickets.
          </p>
          <div className="pt-1 flex gap-2">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark"
            >
              Sign In with OTP
            </button>
            <button
              onClick={() => navigate('/search')}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Find PGs
            </button>
          </div>
        </div>
      )}

      {/* 3. Quick Actions 4x2 Grid (Navigates to dedicated pages) */}
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

          {/* 6. Security & House Rules (Fixed: Opens House Rules/Security, NOT WiFi) */}
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

      {/* 4. Section: Recent Activity (Dynamic from live history) */}
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
            {isLinkedTenant
              ? 'No recent payments or actions recorded. Your monthly dues and receipts will show here.'
              : 'Sign in to an active PG stay to view your live activity history.'}
          </div>
        )}
      </div>
    </div>
  );
};
