import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { DiningPage } from './pages/DiningPage';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { WifiPage } from './pages/WifiPage';
import { NoticePage } from './pages/NoticePage';
import { DocumentsPage } from './pages/DocumentsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<RootRoute />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="payments/history" element={<TransactionHistoryPage />} />
            <Route path="transactions" element={<TransactionHistoryPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="guests" element={<GuestsPage />} />
            <Route path="food" element={<DiningPage />} />
            <Route path="dining" element={<DiningPage />} />
            <Route path="wifi" element={<WifiPage />} />
            <Route path="notice" element={<NoticePage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="my-pg" element={<MyPgPage />} />
            <Route path="menu" element={<ProfilePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="pg/:idOrSlug" element={<PgDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
