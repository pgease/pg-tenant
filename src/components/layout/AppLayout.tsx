import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';
import { SplashScreen } from '../common/SplashScreen';
import { OnboardingCarousel } from '../common/OnboardingCarousel';
import { OfflineScreen } from '../common/OfflineScreen';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { isAppMode, initAppBridge } from '../../utils/appBridge';
import { useAuth } from '../../context/AuthContext';
import { tenantService } from '../../services/tenantService';
import {
  Bell,
  LayoutGrid,
  Search,
  Building2,
  CreditCard,
  FileText,
  Utensils,
  Wifi,
  DoorOpen,
  User,
  LogOut,
  MessageSquareWarning,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { isOnline, checkConnection } = useNetworkStatus();
  const { isAuthenticated, tenant, propertyDetails, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [inAppMode, setInAppMode] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [hasUnread, setHasUnread] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      tenantService
        .getNotices()
        .then((data) => setHasUnread(Array.isArray(data) && data.length > 0))
        .catch(() => setHasUnread(false));
    }
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    const appModeActive = isAppMode();
    setInAppMode(appModeActive);

    // Initialize bridge back navigation
    const cleanupBridge = initAppBridge(() => {
      if (window.history.length > 1) {
        navigate(-1);
        return true;
      }
      return false;
    });

    return () => cleanupBridge();
  }, [navigate, isAuthenticated]);

  // Determine header title from path
  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'PG Ease';
    if (path.startsWith('/search')) return 'Find PG';
    if (path.startsWith('/payments/history') || path.startsWith('/transactions')) return 'Transactions';
    if (path.startsWith('/payments')) return 'Payments';
    if (path.startsWith('/complaints')) return 'Complaints';
    if (path.startsWith('/night-out')) return 'Night Out';
    if (path.startsWith('/guests') || path.startsWith('/guest-entry')) return 'Guest Pass';
    if (path.startsWith('/food')) return 'Food & Dining';
    if (path.startsWith('/wifi')) return 'WiFi Credentials';
    if (path.startsWith('/announcements') || path.startsWith('/notices')) return 'Notice Board';
    if (path.startsWith('/notice-period') || path.startsWith('/notice')) return 'Notice Period';
    if (path.startsWith('/documents')) return 'Documents & KYC';
    if (path.startsWith('/notifications')) return 'Notifications';
    if (path.startsWith('/profile') || path.startsWith('/menu')) return 'Menu';
    if (path.startsWith('/my-pg')) return 'My PG';
    if (path.startsWith('/pg')) return 'PG Details';
    return 'PG Ease';
  };

  const hideTabBar = location.pathname.startsWith('/login') || location.pathname.startsWith('/auth');

  const desktopNavItems = [
    { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
    { to: '/search', label: 'Explore PGs', icon: Search },
    { to: '/my-pg', label: 'My PG Stay', icon: Building2 },
    { to: '/payments', label: 'Rent & Payments', icon: CreditCard },
    { to: '/documents', label: 'Documents & KYC', icon: FileText },
    { to: '/food', label: 'Food Menu', icon: Utensils },
    { to: '/wifi', label: 'Wi-Fi Network', icon: Wifi },
    { to: '/complaints', label: 'Complaints', icon: MessageSquareWarning },
    { to: '/announcements', label: 'Notice Board', icon: Bell },
    { to: '/notice', label: 'Notice Period', icon: DoorOpen },
    { to: '/profile', label: 'Profile & Settings', icon: User },
  ];

  const maskedPhone = tenant?.phone
    ? `${tenant.phone.slice(0, 2)}XXXXX${tenant.phone.slice(-3)}`
    : '';

  return (
    <div className="min-h-dvh w-full bg-slate-900/5 flex justify-center selection:bg-primary selection:text-white">
      {/* Responsive Container: Max 430px on Mobile, Max 6xl (1152px) with 2-column sidebar on Desktop */}
      <div className="relative flex flex-col lg:flex-row w-full max-w-md lg:max-w-6xl min-h-dvh bg-white shadow-2xl overflow-x-hidden">
        
        {/* Offline Screen Overlay */}
        {!isOnline && <OfflineScreen onRetry={checkConnection} />}

        {/* Splash Screen */}
        {showSplash && (
          <SplashScreen onComplete={() => setShowSplash(false)} durationMs={1500} />
        )}

        {/* App Mode Onboarding Carousel */}
        {showOnboarding && (
          <OnboardingCarousel onComplete={() => setShowOnboarding(false)} />
        )}

        {/* Desktop Left Sidebar Navigation (TW-17) */}
        {!hideTabBar && (
          <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:border-r lg:border-gray-100 lg:bg-slate-50/60 p-5 min-h-dvh justify-between">
            <div className="space-y-6">
              {/* Brand Logo */}
              <div
                onClick={() => navigate('/')}
                className="cursor-pointer flex items-center gap-2 px-1"
              >
                <img
                  src="/assets/pgease-full-brand-logo.png"
                  alt="PG Ease"
                  className="h-8 w-auto object-contain"
                />
              </div>

              {/* Resident Profile Snapshot */}
              {isAuthenticated && (
                <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Resident</span>
                    {propertyDetails?.room?.roomNumber && (
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        Room {propertyDetails.room.roomNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {tenant?.name || 'Active Resident'}
                  </p>
                  {maskedPhone && (
                    <p className="text-[11px] text-gray-400 font-mono">
                      {maskedPhone}
                    </p>
                  )}
                </div>
              )}

              {/* Nav Items List */}
              <nav className="space-y-1">
                {desktopNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-[#008080] text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Desktop Sidebar Footer */}
            {isAuthenticated ? (
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to log out?')) {
                      logout();
                      navigate('/login');
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Log Out ({maskedPhone})</span>
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center rounded-xl bg-[#008080] py-2 text-xs font-bold text-white shadow-sm hover:bg-[#006b6b]"
                >
                  Sign In with OTP
                </button>
              </div>
            )}
          </aside>
        )}

        {/* Content Container */}
        <div className="flex-1 min-w-0 flex flex-col min-h-dvh">
          {/* Header with PG Ease Brand Logo (for mobile or subpages) */}
          {!location.pathname.startsWith('/pg/') &&
            !location.pathname.startsWith('/login') &&
            location.pathname !== '/' &&
            location.pathname !== '/home' && (
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100/80 bg-white/95 px-5 py-3.5 backdrop-blur-md pt-safe">
              <div className="flex items-center gap-2">
                <div
                  onClick={() => navigate('/')}
                  className="cursor-pointer flex items-center"
                >
                  <img
                    src="/assets/pgease-full-brand-logo.png"
                    alt="PG Ease"
                    className="h-7 w-auto object-contain"
                  />
                </div>

                <span className="text-sm font-bold text-brandText tracking-tight border-l border-gray-200 pl-2 truncate max-w-[200px]">
                  {getHeaderTitle()}
                </span>
              </div>

              {/* Notification Bell (Navigates to /notifications) */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:text-brandText hover:bg-gray-100 transition-all active:scale-95 tap-target"
                title="Notifications"
              >
                <Bell className="h-5 w-5" strokeWidth={1.8} />
                {hasUnread && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>
            </header>
          )}

          {/* Main Content Area */}
          <main
            className={`flex-1 overflow-y-auto ${
              !location.pathname.startsWith('/login') ? 'px-5 py-4' : ''
            } ${!hideTabBar ? 'pb-24 lg:pb-8' : 'pb-safe'}`}
          >
            <Outlet context={{ inAppMode }} />
          </main>
        </div>

        {/* Bottom Tab Bar (Mobile only, hidden on lg screens) */}
        {!hideTabBar && <BottomTabBar />}
      </div>
    </div>
  );
};
