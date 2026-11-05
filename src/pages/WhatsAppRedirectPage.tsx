import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, MessageSquare } from 'lucide-react';

export const WhatsAppRedirectPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    // Suffix is everything after /wa/
    const rawSuffix = location.pathname.replace(/^\/wa\/?/, '').trim();
    const cleanSuffix = rawSuffix.split('?')[0];
    const searchParams = location.search;

    let destination = '/';

    // 1. Signed token suffix: s/{token}
    if (cleanSuffix.startsWith('s/')) {
      const token = cleanSuffix.slice(2);
      try {
        // Base64URL decode
        const normalized = token.replace(/-/g, '+').replace(/_/g, '/');
        const json = atob(normalized);
        const parsed = JSON.parse(json);

        // Expiry check
        if (parsed.exp && Date.now() / 1000 > parsed.exp) {
          console.warn('WhatsApp link expired');
        }

        switch (parsed.type) {
          case 'pay':
          case 'payment':
            destination = '/payments';
            break;
          case 'receipt':
            destination = '/payments/history';
            break;
          case 'kyc':
          case 'agreement':
            destination = '/documents';
            break;
          case 'complaint':
            destination = '/complaints';
            break;
          case 'notice':
            destination = '/notice';
            break;
          case 'nightout':
          case 'night-out':
            destination = '/guests';
            break;
          case 'checkout':
            destination = '/my-pg';
            break;
          default:
            destination = '/';
        }
      } catch (e) {
        console.error('Failed to parse signed token', e);
        destination = '/';
      }
    } else {
      // 2. Readable path suffix mapping
      const parts = cleanSuffix.toLowerCase().split('/').filter(Boolean);

      if (parts.includes('pay') || parts.includes('payment') || parts.includes('payments')) {
        destination = `/payments${searchParams}`;
      } else if (parts.includes('receipt') || parts.includes('receipts') || parts.includes('history')) {
        destination = `/payments/history${searchParams}`;
      } else if (parts.includes('kyc') || parts.includes('agreement') || parts.includes('documents')) {
        destination = `/documents${searchParams}`;
      } else if (parts.includes('complaint') || parts.includes('complaints')) {
        destination = `/complaints${searchParams}`;
      } else if (parts.includes('notice') || parts.includes('notices')) {
        destination = `/notice${searchParams}`;
      } else if (parts.includes('night-out') || parts.includes('nightout') || parts.includes('guests')) {
        destination = `/guests${searchParams}`;
      } else if (parts.includes('checkout')) {
        destination = `/my-pg${searchParams}`;
      } else {
        destination = '/';
      }
    }

    setTarget(destination);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (isLoading || !target) return;

    if (isAuthenticated) {
      navigate(target, { replace: true });
    } else {
      sessionStorage.setItem('pgease_post_login_redirect', target);
      navigate(`/login?redirect=${encodeURIComponent(target)}`, { replace: true });
    }
  }, [isAuthenticated, isLoading, target, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mb-4 animate-bounce">
        <MessageSquare className="h-6 w-6" />
      </div>
      <Loader2 className="h-6 w-6 animate-spin text-teal-600 mb-2" />
      <h2 className="text-sm font-bold text-gray-800">Redirecting to your request...</h2>
      <p className="text-xs text-gray-500 mt-1">Opening your PG Ease resident record.</p>
    </div>
  );
};

export default WhatsAppRedirectPage;

