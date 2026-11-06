import React, { useState, useEffect } from 'react';
import {
  BellRing,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Info,
  Loader2,
  Megaphone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenantService } from '../services/tenantService';
import { useAuth } from '../context/AuthContext';

export interface NoticeItem {
  id: string;
  title: string;
  message?: string;
  description?: string;
  category?: string;
  priority?: 'normal' | 'high' | 'urgent';
  createdAt?: string;
  targetType?: string;
}

export const AnnouncementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, propertyDetails } = useAuth();

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'general'>('all');

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      tenantService
        .getNotices()
        .then((data) => {
          setNotices(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          setNotices([]);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const filtered = notices.filter((n) => {
    if (filter === 'urgent') return n.priority === 'urgent' || n.priority === 'high';
    if (filter === 'general') return n.priority === 'normal' || !n.priority;
    return true;
  });

  return (
    <div className="space-y-4 pt-1 pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brandText tap-target"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
          PG Notice Board
        </span>
      </div>

      {/* Main Title Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-700 via-indigo-800 to-indigo-950 p-5 text-white shadow-lg space-y-1.5">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-purple-300" />
          <h2 className="text-base font-bold tracking-tight">Property Announcements</h2>
        </div>
        <p className="text-xs text-purple-200/90 leading-relaxed">
          Official announcements, maintenance schedules, and security alerts from{' '}
          {propertyDetails?.property?.name || 'your PG management'}.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(
          [
            ['all', `All (${notices.length})`],
            ['urgent', `Urgent (${notices.filter((n) => n.priority === 'urgent' || n.priority === 'high').length})`],
            ['general', `General (${notices.filter((n) => n.priority === 'normal' || !n.priority).length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              filter === key
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-purple-600 mb-2" />
            <p className="text-xs font-medium text-gray-500">Loading notices...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <BellRing className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-brandText">No Announcements</h3>
            <p className="text-xs text-gray-400">
              There are no active notices published by your PG owner at this time.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isUrgent = item.priority === 'urgent' || item.priority === 'high';
            const formattedDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recent';

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4.5 transition-all space-y-2 shadow-xs ${
                  isUrgent
                    ? 'border-amber-200 bg-amber-50/40 text-brandText'
                    : 'border-gray-100 bg-white text-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isUrgent ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    ) : (
                      <Info className="h-4 w-4 text-purple-600 shrink-0" />
                    )}
                    <h4 className="text-sm font-bold text-brandText leading-snug">{item.title}</h4>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      item.priority === 'urgent'
                        ? 'bg-red-100 text-red-700'
                        : item.priority === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {item.priority || 'Normal'}
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                  {item.message || item.description || ''}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="h-3 w-3" /> {formattedDate}
                  </span>
                  {item.category && (
                    <span className="font-semibold capitalize text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
