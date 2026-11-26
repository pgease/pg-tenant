import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { SavedPage } from './pages/SavedPage';
import { ProfilePage } from './pages/ProfilePage';
import { PgDetailPage } from './pages/PgDetailPage';
import { LoginPage } from './pages/LoginPage';

import { MyPgPage } from './pages/MyPgPage';

// Dedicated Feature Pages
import { ComplaintsPage } from './pages/ComplaintsPage';
import { GuestsPage } from './pages/GuestsPage';
import { NightOutPage } from './pages/NightOutPage';
import { DiningPage } from './pages/DiningPage';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { PaymentResultPage } from './pages/PaymentResultPage';
import { WifiPage } from './pages/WifiPage';
import { NoticePage } from './pages/NoticePage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { WhatsAppRedirectPage } from './pages/WhatsAppRedirectPage';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import { TenantOfflineBanner } from './components/common/MascotEmptyState';

const RootRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const isGuestMode = sessionStorage.getItem('pgease_guest_mode') === 'true';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <span className="text-xs font-semibold">Loading PG Ease...</span>
      </div>
    );
  }

  // 1. First-time unauthenticated visitor who hasn't chosen to skip -> First page is Login
  if (!isAuthenticated && !isGuestMode) {
    return <Navigate to="/login" replace />;
  }

  // 2. Authenticated resident or guest explorer -> show Dashboard
  return <HomePage />;
};

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <span className="text-xs font-semibold">Loading PG Ease...</span>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function TenantBackManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const [exitOpen, setExitOpen] = useState(false);

  useEffect(() => {
    const handleBack = (): 'handled' => {
      const closeBtn = document.querySelector('[data-state="open"] button[aria-label="Close"]') as HTMLButtonElement | null;
      if (closeBtn) {
        closeBtn.click();
        return 'handled';
      }
      const isRoot = location.pathname === '/' || location.pathname === '/login';
      const isTabRoot = ['/', '/search', '/my-pg', '/payments', '/profile'].includes(location.pathname);

      if (!isTabRoot) {
        navigate(-1);
        return 'handled';
      }
      if (!isRoot) {
        navigate('/');
        return 'handled';
      }
      setExitOpen(true);
      return 'handled';
    };

    (window as any).__pgeaseHandleBack = handleBack;
    const capApp = (window as any).Capacitor?.Plugins?.App;
    const listener = capApp?.addListener?.('backButton', () => handleBack());
    return () => {
      delete (window as any).__pgeaseHandleBack;
      void listener?.then?.((h: { remove: () => void }) => h.remove());
    };
  }, [location.pathname, navigate]);

  if (!exitOpen) return null;
  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 px-6">
      <div className="w-full max-w-[320px] rounded-[20px] bg-white dark:bg-[#1F2937] p-5 shadow-2xl">
        <h3 className="text-[17px] font-semibold text-[#1F2937] dark:text-[#F3F4F6]">Exit PG Ease?</h3>
        <p className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] mt-1.5">
          Are you sure you want to close PG Ease?
        </p>
        <div className="flex justify-end gap-2.5 mt-5">
          <button
            type="button"
            onClick={() => setExitOpen(false)}
            className="px-4 h-10 rounded-[12px] border border-[#E5E9EB] dark:border-[#374151] text-[13px] font-semibold text-[#1F2937] dark:text-[#F3F4F6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setExitOpen(false);
              const capApp = (window as any).Capacitor?.Plugins?.App;
              if (capApp?.exitApp) void capApp.exitApp();
            }}
            className="px-4 h-10 rounded-[12px] bg-[#008080] text-white text-[13px] font-semibold"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <TenantBackManager />
        <TenantOfflineBanner />
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<RootRoute />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="payments" element={<RequireAuth><PaymentsPage /></RequireAuth>} />
            <Route path="payments/result" element={<RequireAuth><PaymentResultPage /></RequireAuth>} />
            <Route path="payments/history" element={<RequireAuth><TransactionHistoryPage /></RequireAuth>} />
            <Route path="transactions" element={<RequireAuth><TransactionHistoryPage /></RequireAuth>} />
            <Route path="complaints" element={<RequireAuth><ComplaintsPage /></RequireAuth>} />
            <Route path="guests" element={<RequireAuth><GuestsPage /></RequireAuth>} />
            <Route path="guest-entry" element={<RequireAuth><GuestsPage /></RequireAuth>} />
            <Route path="night-out" element={<RequireAuth><NightOutPage /></RequireAuth>} />
            <Route path="food" element={<RequireAuth><DiningPage /></RequireAuth>} />
            <Route path="dining" element={<RequireAuth><DiningPage /></RequireAuth>} />
            <Route path="wifi" element={<RequireAuth><WifiPage /></RequireAuth>} />
            <Route path="notice" element={<RequireAuth><NoticePage /></RequireAuth>} />
            <Route path="notice-period" element={<RequireAuth><NoticePage /></RequireAuth>} />
            <Route path="announcements" element={<RequireAuth><AnnouncementsPage /></RequireAuth>} />
            <Route path="notices" element={<RequireAuth><AnnouncementsPage /></RequireAuth>} />
            <Route path="documents" element={<RequireAuth><DocumentsPage /></RequireAuth>} />
            <Route path="notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
            <Route path="saved" element={<RequireAuth><SavedPage /></RequireAuth>} />
            <Route path="my-pg" element={<MyPgPage />} />
            <Route path="menu" element={<ProfilePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="pg/:idOrSlug" element={<PgDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="wa/*" element={<WhatsAppRedirectPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
