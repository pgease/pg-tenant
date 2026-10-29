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

// Dedicated Feature Pages
import { ComplaintsPage } from './pages/ComplaintsPage';
import { GuestsPage } from './pages/GuestsPage';
import { DiningPage } from './pages/DiningPage';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { WifiPage } from './pages/WifiPage';
import { NoticePage } from './pages/NoticePage';
import { DocumentsPage } from './pages/DocumentsPage';
import { NotificationsPage } from './pages/NotificationsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
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
