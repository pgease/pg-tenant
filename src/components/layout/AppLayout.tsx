import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';
import { MobileDrawer } from './MobileDrawer';
import { SplashScreen } from '../common/SplashScreen';
import { OnboardingCarousel } from '../common/OnboardingCarousel';
import { OfflineScreen } from '../common/OfflineScreen';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { isAppMode, initAppBridge } from '../../utils/appBridge';
import { useAuth } from '../../context/AuthContext';
import { tenantService } from '../../services/tenantService';
import { rootTabPaths } from '../../navigation/appMenu';
import { ArrowLeft, Bell, Menu } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { isOnline, checkConnection } = useNetworkStatus();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [inAppMode, setInAppMode] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pgease_onboarding_carousel_seen') !== '1';
    } catch {
      return false;
    }
  });
  const [hasUnread, setHasUnread] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      tenantService
        .getNotices()
        .then((data) => setHasUnread(Array.isArray(data) && data.length > 0))
        .catch(() => setHasUnread(false));
    }
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    setDrawerOpen(false);
    mainRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
    if (path.startsWith('/food') || path.startsWith('/dining')) return 'Food & Dining';
    if (path.startsWith('/saved')) return 'Saved Properties';
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
  const isHome = location.pathname === '/' || location.pathname === '/home';
  const isDetail = location.pathname.startsWith('/pg/');
  const showAppBar = !location.pathname.startsWith('/login') && !isDetail;
  const showBack = showAppBar && !isHome && !rootTabPaths.has(location.pathname);

  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-[#005F5F] to-[#008080] flex items-center justify-center p-0 md:p-6 selection:bg-[#008080] selection:text-white relative">
      {/* Centred Phone Frame (max-width 480px, full height on mobile, 24px rounded corners & soft shadow on desktop) */}
      <div className="relative flex flex-col w-full md:max-w-[480px] h-dvh md:h-[calc(100dvh-48px)] md:max-h-[920px] bg-white md:rounded-[24px] shadow-2xl overflow-hidden">
        
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

        {/* Slide-in Drawer */}
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        {/* Safe-Area Aware Mobile App Header */}
        {showAppBar && (
          <header className="sticky top-0 z-20 flex items-center gap-1 border-b border-gray-100/80 bg-white/95 px-3 backdrop-blur-md pt-safe min-h-14 shrink-0">
            {showBack ? (
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) navigate(-1);
                  else navigate('/');
                }}
                className="flex h-11 shrink-0 items-center gap-1 rounded-full px-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            {/* Header Brand / Title: Logo+wordmark on Home only, Logo icon+Page title on subpages */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {isHome ? (
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex h-11 shrink-0 items-center"
                  aria-label="PG Ease"
                >
                  <img
                    src="/assets/pgease-full-brand-logo.png"
                    alt="PG Ease"
                    className="h-6 w-auto object-contain"
                  />
                </button>
              ) : (
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg overflow-hidden"
                    aria-label="Home"
                  >
                    <img
                      src="/assets/pgease-logo-icon.png"
                      alt="PG Ease"
                      className="h-6 w-6 object-contain rounded-md"
                    />
                  </button>
                  <h1 className="min-w-0 truncate text-base font-bold text-brandText">
                    {getHeaderTitle()}
                  </h1>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-brandText"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" strokeWidth={1.8} />
              {hasUnread && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>
          </header>
        )}

        {/* Scrollable Viewport */}
        <main
          ref={mainRef}
          className={`flex-1 min-h-0 overflow-x-hidden overflow-y-auto ${
            !location.pathname.startsWith('/login') ? 'px-4 py-3 sm:px-5' : ''
          }`}
        >
          <Outlet context={{ inAppMode }} />
        </main>

        {/* Sticky Mobile Bottom Navigation */}
        {!hideTabBar && <BottomTabBar />}
      </div>

      {/* Desktop Branding Badge in Canvas Corner */}
      <div className="hidden md:flex fixed bottom-6 left-6 items-center gap-2.5 text-white/80 text-xs select-none">
        <img
          src="/assets/pgease-full-brand-logo.png"
          alt="PG Ease"
          className="h-5 w-auto brightness-0 invert opacity-75"
        />
        <span className="text-white/40">|</span>
        <span className="font-medium text-white/80">Tenant App Experience</span>
      </div>
    </div>
  );
};
