import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock, AlertCircle, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tenantService } from '../services/tenantService';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'dues' | 'complaint' | 'dining' | 'general';
  read: boolean;
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      tenantService
        .getNotices()
        .then((notices) => {
          if (Array.isArray(notices) && notices.length > 0) {
            setNotifications(
              notices.map((n: any, idx: number) => ({
                id: n.id || `notif-${idx}`,
                title: n.title || 'Notice from PG Management',
                message: n.content || n.message || n.description || '',
                time: n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent',
                type: (n.type as any) || 'general',
                read: Boolean(n.isRead),
              }))
            );
          } else {
            setNotifications([]);
          }
        })
        .catch(() => {
          setNotifications([]);
        })
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="space-y-4 pt-1 pb-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brandText tap-target"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] font-bold text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-gray-400 hover:text-red-500 p-1"
              title="Clear all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
            <p className="text-xs font-medium text-gray-500">Checking for updates...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-primary">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-brandText">No Notifications</h3>
            <p className="text-xs text-gray-400">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 transition-all ${
                item.read
                  ? 'border-gray-100 bg-white text-gray-600'
                  : 'border-teal-100 bg-teal-50/40 text-brandText'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 ${
                    item.type === 'dues'
                      ? 'bg-amber-100 text-amber-700'
                      : item.type === 'dining'
                      ? 'bg-orange-100 text-orange-700'
                      : item.type === 'complaint'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-teal-100 text-primary'
                  }`}
                >
                  {item.type === 'dues' && <AlertCircle className="h-4 w-4" />}
                  {item.type === 'dining' && <Clock className="h-4 w-4" />}
                  {item.type === 'complaint' && <AlertCircle className="h-4 w-4" />}
                  {item.type === 'general' && <CheckCircle2 className="h-4 w-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-brandText truncate">{item.title}</h4>
                    <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">{item.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
