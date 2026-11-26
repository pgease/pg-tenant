import React, { useState, useEffect } from 'react';
import {
  Bell,
  Megaphone,
  Wrench,
  IndianRupee,
  Trash2,
  CheckCheck,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tenantService } from '../services/tenantService';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  type: 'notice' | 'complaint' | 'payment' | 'general';
  read: boolean;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'min' : 'mins'} ago`;
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getGroupKey(date: Date): 'Today' | 'This week' | 'Earlier' {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneWeekAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const time = date.getTime();

  if (time >= startOfToday) return 'Today';
  if (time >= oneWeekAgo) return 'This week';
  return 'Earlier';
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
              notices.map((n: any, idx: number) => {
                const rawType = String(n.type || '').toLowerCase();
                let type: NotificationItem['type'] = 'general';
                if (rawType.includes('rent') || rawType.includes('pay') || rawType.includes('due')) {
                  type = 'payment';
                } else if (rawType.includes('complaint') || rawType.includes('issue') || rawType.includes('repair')) {
                  type = 'complaint';
                } else if (rawType.includes('notice') || rawType.includes('circular') || rawType.includes('broadcast')) {
                  type = 'notice';
                }

                const d = n.createdAt ? new Date(n.createdAt) : new Date(Date.now() - idx * 3600000 * 4);

                return {
                  id: n.id || `notif-${idx}`,
                  title: n.title || 'Notice from PG Management',
                  message: n.content || n.message || n.description || '',
                  createdAt: d,
                  type,
                  read: Boolean(n.isRead),
                };
              })
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

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this notification?')) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  // Group by Today, This week, Earlier
  const groups: Record<'Today' | 'This week' | 'Earlier', NotificationItem[]> = {
    Today: [],
    'This week': [],
    Earlier: [],
  };

  notifications.forEach((item) => {
    const key = getGroupKey(item.createdAt);
    groups[key].push(item);
  });

  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'notice':
        return <Megaphone className="h-4.5 w-4.5 text-[#005F5F]" />;
      case 'complaint':
        return <Wrench className="h-4.5 w-4.5 text-[#005F5F]" />;
      case 'payment':
        return <IndianRupee className="h-4.5 w-4.5 text-emerald-600" />;
      default:
        return <Bell className="h-4.5 w-4.5 text-[#008080]" />;
    }
  };

  const getTypeBg = (type: NotificationItem['type']) => {
    switch (type) {
      case 'notice':
        return 'bg-[#E6F3F3]';
      case 'complaint':
        return 'bg-[#E6F3F3]';
      case 'payment':
        return 'bg-emerald-50';
      default:
        return 'bg-teal-50';
    }
  };

  return (
    <div className="space-y-4 pt-1 pb-8 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
            <p className="text-xs text-gray-500">Rent reminders, notices & stay updates</p>
          </div>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/50 px-3 py-1.5 text-xs font-bold text-[#008080] hover:bg-teal-50 transition-colors cursor-pointer"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-[#008080] mb-2" />
          <p className="text-xs font-medium text-gray-500">Checking for updates...</p>
        </div>
      ) : notifications.length === 0 ? (
        /* Empty State (T7) */
        <div className="flex flex-col items-center justify-center pt-16 text-center px-4 animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-[#008080] mb-4 shadow-sm">
            <Bell className="h-10 w-10 text-[#008080]" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No notifications yet</h3>
          <p className="mt-2 max-w-xs text-xs text-gray-500 leading-relaxed">
            We'll notify you about rent reminders, notices, and updates here.
          </p>
        </div>
      ) : (
        /* Date-grouped Notifications (T7) */
        <div className="space-y-5">
          {(['Today', 'This week', 'Earlier'] as const).map((groupTitle) => {
            const items = groups[groupTitle];
            if (items.length === 0) return null;

            return (
              <div key={groupTitle} className="space-y-2">
                <h3 className="px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {groupTitle}
                </h3>

                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-100">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start justify-between p-3.5 sm:p-4 gap-3 transition-colors ${
                        item.read ? 'bg-white hover:bg-slate-50/50' : 'bg-[#E6F3F3]/40 hover:bg-[#E6F3F3]/60'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Type Icon (T7) */}
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getTypeBg(
                            item.type
                          )}`}
                        >
                          {getTypeIcon(item.type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-xs sm:text-sm truncate ${
                                item.read ? 'font-semibold text-gray-800' : 'font-bold text-gray-900'
                              }`}
                            >
                              {item.title}
                            </h4>
                            {!item.read && (
                              <span className="h-2 w-2 rounded-full bg-[#008080] shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                            {item.message}
                          </p>
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Trash action with confirm dialog (T7) */}
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                        title="Delete notification"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
