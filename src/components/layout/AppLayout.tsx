import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';
import { SplashScreen } from '../common/SplashScreen';
import { OnboardingCarousel } from '../common/OnboardingCarousel';
import { OfflineScreen } from '../common/OfflineScreen';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { isAppMode, initAppBridge } from '../../utils/appBridge';
import { useAuth } from '../../context/AuthContext';
import { Bell } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { isOnline, checkConnection } = useNetworkStatus();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [inAppMode, setInAppMode] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

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

    if (appModeActive) {
      const splashShown = sessionStorage.getItem('pgease_splash_shown');
      if (!splashShown) {
        setShowSplash(true);
        sessionStorage.setItem('pgease_splash_shown', 'true');
      }

      const onboardingDone = localStorage.getItem('pgease_onboarding_completed') === 'true';
      if (!isAuthenticated && !onboardingDone) {
        setShowOnboarding(true);
      }
    }

    return () => cleanupBridge();
  }, [navigate, isAuthenticated]);

  // Determine header title from path matching screenshots
  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'PG Ease';
    if (path.startsWith('/search')) return 'Find PG';
    if (path.startsWith('/payments/history') || path.startsWith('/transactions')) return 'Transactions';
    if (path.startsWith('/payments')) return 'Payments';
    if (path.startsWith('/complaints')) return 'Complaints';
    if (path.startsWith('/guests')) return 'Guests & Passes';
    if (path.startsWith('/food')) return 'Food & Dining';
    if (path.startsWith('/wifi')) return 'WiFi Credentials';
    if (path.startsWith('/notice')) return 'Notice Period';
    if (path.startsWith('/documents')) return 'Documents & KYC';
    if (path.startsWith('/notifications')) return 'Notifications';
    if (path.startsWith('/profile') || path.startsWith('/menu')) return 'Menu';
    if (path.startsWith('/my-pg')) return 'My PG';
    if (path.startsWith('/pg')) return 'PG Details';
    return 'PG Ease';
  };

  const hideTabBar = location.pathname.startsWith('/login') || location.pathname.startsWith('/auth');

  return (
    <div className="min-h-dvh w-full bg-slate-900/5 flex justify-center selection:bg-primary selection:text-white">
      {/* Mobile-first Container Frame (Max 430px wide, centered on Desktop) */}
      <div className="relative flex flex-col w-full max-w-md min-h-dvh bg-white shadow-2xl overflow-x-hidden">
        
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

        {/* Official Header with PG Ease Brand Logo (for subpages) */}
        {!location.pathname.startsWith('/pg/') &&
          !location.pathname.startsWith('/login') &&
          location.pathname !== '/' &&
          location.pathname !== '/home' && (
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100/80 bg-white/95 px-5 py-3.5 backdrop-blur-md pt-safe">
            <div className="flex items-center gap-2">
              {/* Official PG Ease Full Brand Logo */}
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

              {location.pathname !== '/' && location.pathname !== '/home' && (
                <span className="text-sm font-bold text-brandText tracking-tight border-l border-gray-200 pl-2 truncate max-w-[170px]">
                  {getHeaderTitle()}
                </span>
              )}
            </div>

            {/* Notification Bell with Red Dot (Navigates to /notifications) */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:text-brandText hover:bg-gray-100 transition-all active:scale-95 tap-target"
              title="Notifications"
            >
              <Bell className="h-5 w-5" strokeWidth={1.8} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
          </header>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto px-5 py-4 ${!hideTabBar ? 'pb-24' : 'pb-safe'}`}>
          <Outlet context={{ inAppMode }} />
        </main>

        {/* Bottom Tab Bar */}
        {!hideTabBar && <BottomTabBar />}
      </div>
    </div>
  );
};
