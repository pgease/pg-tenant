import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  ArrowLeft,
  AlertCircle,
  Loader2,
  RefreshCw,
  Coffee,
  Sun,
  Moon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenantService } from '../services/tenantService';
import { useAuth } from '../context/AuthContext';

export interface DayOption {
  dayOfWeek: number; // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  dayName: string;
  shortName: string;
}

export const DAYS_MAP: DayOption[] = [
  { dayOfWeek: 1, dayName: 'Monday', shortName: 'Mon' },
  { dayOfWeek: 2, dayName: 'Tuesday', shortName: 'Tue' },
  { dayOfWeek: 3, dayName: 'Wednesday', shortName: 'Wed' },
  { dayOfWeek: 4, dayName: 'Thursday', shortName: 'Thu' },
  { dayOfWeek: 5, dayName: 'Friday', shortName: 'Fri' },
  { dayOfWeek: 6, dayName: 'Saturday', shortName: 'Sat' },
  { dayOfWeek: 0, dayName: 'Sunday', shortName: 'Sun' },
];

interface MealSlotInfo {
  menuText: string;
  items: string[];
  startTime: string | null;
  endTime: string | null;
  timeRange: string;
}

interface DayMenuInfo {
  dayName: string;
  dayOfWeek: number;
  breakfast: MealSlotInfo;
  lunch: MealSlotInfo;
  dinner: MealSlotInfo;
}

/**
 * Converts 24-hour time "08:00" to readable 12-hour "8:00 AM"
 */
function formatTime12h(timeStr?: string | null): string {
  if (!timeStr) return '';
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Normalizes raw meal data from API into structured MealSlotInfo
 */
function parseMealSlot(mealRaw: any, defaultRange: string): MealSlotInfo {
  if (!mealRaw) {
    return {
      menuText: '',
      items: [],
      startTime: null,
      endTime: null,
      timeRange: defaultRange,
    };
  }

  let menuText = '';
  let startTime: string | null = null;
  let endTime: string | null = null;

  if (typeof mealRaw === 'string') {
    menuText = mealRaw.trim();
  } else if (Array.isArray(mealRaw)) {
    menuText = mealRaw.join(', ').trim();
  } else if (typeof mealRaw === 'object') {
    menuText = String(mealRaw.menu || mealRaw.items || mealRaw.name || '').trim();
    startTime = mealRaw.startTime ? String(mealRaw.startTime).trim() : null;
    endTime = mealRaw.endTime ? String(mealRaw.endTime).trim() : null;
  }

  // Split menu into discrete items by comma, newline, bullet points, or semicolons
  const items = menuText
    ? menuText
        .split(/[\r\n,;•]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const timeRange =
    startTime && endTime
      ? `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`
      : defaultRange;

  return {
    menuText,
    items,
    startTime,
    endTime,
    timeRange,
  };
}

export const DiningPage: React.FC = () => {
  const navigate = useNavigate();
  const { propertyDetails } = useAuth();

  const [scheduleData, setScheduleData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Active day selection: default to current day (0=Sunday, 1=Monday, ... 4=Thursday, etc.)
  const todayDayOfWeek = new Date().getDay();
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(todayDayOfWeek);

  const loadDining = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await tenantService.getDiningSchedule();
      setScheduleData(res);
    } catch (err) {
      console.warn('Failed to load dining schedule:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDining();
  }, []);

  const currentDayOption = useMemo(() => {
    return DAYS_MAP.find((d) => d.dayOfWeek === selectedDayOfWeek) || DAYS_MAP[0];
  }, [selectedDayOfWeek]);

  /**
   * Resolves the menu for the selected day from the API data
   */
  const currentDayMenu = useMemo<DayMenuInfo>(() => {
    const defaultSchedule: DayMenuInfo = {
      dayName: currentDayOption.dayName,
      dayOfWeek: currentDayOption.dayOfWeek,
      breakfast: parseMealSlot(null, '08:30 AM – 09:30 AM'),
      lunch: parseMealSlot(null, '01:00 PM – 02:30 PM'),
      dinner: parseMealSlot(null, '08:00 PM – 10:00 PM'),
    };

    if (!scheduleData) return defaultSchedule;

    // Normalize schedule list from various backend envelope shapes
    const rawList = Array.isArray(scheduleData)
      ? scheduleData
      : Array.isArray(scheduleData?.schedule)
      ? scheduleData.schedule
      : Array.isArray(scheduleData?.data?.schedule)
      ? scheduleData.data.schedule
      : Array.isArray(scheduleData?.data)
      ? scheduleData.data
      : null;

    if (rawList && rawList.length > 0) {
      // Find item where dayOfWeek matches (0=Sun, 1=Mon, ..., 4=Thu, 5=Fri, 6=Sat) or dayName matches
      const found = rawList.find(
        (item: any) =>
          Number(item.dayOfWeek) === currentDayOption.dayOfWeek ||
          String(item.dayName || '').toLowerCase() === currentDayOption.dayName.toLowerCase(),
      );

      if (found) {
        return {
          dayName: currentDayOption.dayName,
          dayOfWeek: found.dayOfWeek ?? currentDayOption.dayOfWeek,
          breakfast: parseMealSlot(found.breakfast, '08:30 AM – 09:30 AM'),
          lunch: parseMealSlot(found.lunch, '01:00 PM – 02:30 PM'),
          dinner: parseMealSlot(found.dinner, '08:00 PM – 10:00 PM'),
        };
      }
    } else if (scheduleData?.schedule && typeof scheduleData.schedule === 'object') {
      const found =
        scheduleData.schedule[currentDayOption.dayName] ||
        scheduleData.schedule[currentDayOption.dayName.toLowerCase()] ||
        scheduleData.schedule[currentDayOption.dayOfWeek];

      if (found) {
        return {
          dayName: currentDayOption.dayName,
          dayOfWeek: currentDayOption.dayOfWeek,
          breakfast: parseMealSlot(found.breakfast, '08:30 AM – 09:30 AM'),
          lunch: parseMealSlot(found.lunch, '01:00 PM – 02:30 PM'),
          dinner: parseMealSlot(found.dinner, '08:00 PM – 10:00 PM'),
        };
      }
    }

    return defaultSchedule;
  }, [scheduleData, currentDayOption]);

  const mealSlots = [
    {
      type: 'Breakfast',
      icon: Coffee,
      slot: currentDayMenu.breakfast,
      color: 'border-amber-200 bg-amber-50 text-amber-800',
      badgeBg: 'bg-amber-50 text-amber-900 border-amber-200',
    },
    {
      type: 'Lunch',
      icon: Sun,
      slot: currentDayMenu.lunch,
      color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      badgeBg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    },
    {
      type: 'Dinner',
      icon: Moon,
      slot: currentDayMenu.dinner,
      color: 'border-indigo-200 bg-indigo-50 text-indigo-800',
      badgeBg: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    },
  ];

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
          <button
            type="button"
            onClick={() => loadDining(true)}
            disabled={isRefreshing}
            className="p-1.5 rounded-full text-gray-400 hover:text-brandText hover:bg-gray-100 transition-colors"
            title="Refresh Menu"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          </button>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-primary">
            {propertyDetails?.property?.name || 'Mess Dining'}
          </span>
        </div>
      </div>

      {/* Days of Week Selector Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {DAYS_MAP.map((day) => {
          const isSelected = selectedDayOfWeek === day.dayOfWeek;
          const isToday = day.dayOfWeek === todayDayOfWeek;
          return (
            <button
              key={day.dayOfWeek}
              type="button"
              onClick={() => setSelectedDayOfWeek(day.dayOfWeek)}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all tap-target flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{day.dayName}</span>
              {isToday && (
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-teal-100 text-teal-800'
                  }`}
                >
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Meal Slots Feed */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-gray-100 bg-white space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-gray-400 font-medium">Loading food menu from PG manager...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mealSlots.map((slot) => {
            const hasItems = slot.slot.items.length > 0;
            const Icon = slot.icon;

            return (
              <div
                key={slot.type}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-2.5 transition-all hover:border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-xl px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 border ${slot.color}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {slot.type}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                    <Clock className="h-3 w-3 text-gray-400" />
                    {slot.slot.timeRange}
                  </span>
                </div>

                {hasItems ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {slot.slot.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-brandText border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : slot.slot.menuText ? (
                  <p className="text-xs font-medium text-brandText pt-1 pl-0.5">
                    {slot.slot.menuText}
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 italic pt-1">
                    No menu specified for this meal by PG manager.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mess Guidelines */}
      <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 space-y-2 text-xs text-gray-600">
        <h4 className="font-bold text-brandText flex items-center gap-1.5">
          <AlertCircle className="h-4 w-4 text-primary" />
          Mess Rules & Timings
        </h4>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-500">
          <li>Please inform the mess manager 2 hours before meal time if skipping.</li>
          <li>Outside food is permitted only in designated dining areas.</li>
          <li>Utensils must be placed on the return rack after dining.</li>
        </ul>
      </div>
    </div>
  );
};
