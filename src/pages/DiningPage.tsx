import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Clock,
  ArrowLeft,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenantService } from '../services/tenantService';
import { useAuth } from '../context/AuthContext';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DiningPage: React.FC = () => {
  const navigate = useNavigate();
  const { propertyDetails } = useAuth();

  const [scheduleData, setScheduleData] = useState<any>(null);

  // Active day selection
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[todayIndex]);

  // Today's Meal Check-in status (defaults to pending unless marked by user)
  const [meals, setMeals] = useState<Record<string, 'marked' | 'skipped' | 'pending'>>({
    Breakfast: 'pending',
    Lunch: 'pending',
    Dinner: 'pending',
  });

  const loadDining = async () => {
    try {
      const data = await tenantService.getDiningSchedule();
      setScheduleData(data);
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    loadDining();
  }, []);

  const toggleMealStatus = (mealName: string) => {
    setMeals((prev) => {
      const current = prev[mealName];
      const next = current === 'marked' ? 'skipped' : 'marked';
      return { ...prev, [mealName]: next };
    });
  };

  const getMealMenu = (day: string, mealType: string): string[] => {
    if (scheduleData?.schedule?.[day]?.[mealType]) {
      const item = scheduleData.schedule[day][mealType];
      return Array.isArray(item) ? item : [item];
    }
    return [];
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

        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-primary">
          {propertyDetails?.property?.name || 'Mess Dining'}
        </span>
      </div>

      {/* Today Check-in Card */}
      <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold text-brandText">Today's Meal Check-in</h3>
          </div>
          <span className="text-[11px] font-semibold text-teal-800">Saves Food Waste</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { name: 'Breakfast', time: '8:00 AM' },
            { name: 'Lunch', time: '12:30 PM' },
            { name: 'Dinner', time: '8:00 PM' },
          ].map((meal) => {
            const status = meals[meal.name] || 'pending';
            const isMarked = status === 'marked';
            return (
              <button
                key={meal.name}
                type="button"
                onClick={() => toggleMealStatus(meal.name)}
                className={`flex flex-col items-center justify-center rounded-xl p-2.5 transition-all tap-target border ${
                  isMarked
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="text-[11px] font-bold">{meal.name}</span>
                <span className="text-[9px] text-gray-400 mt-0.5">{meal.time}</span>
                <span
                  className={`mt-1.5 flex items-center gap-0.5 text-[10px] font-bold ${
                    isMarked ? 'text-emerald-700' : 'text-gray-400'
                  }`}
                >
                  {isMarked ? (
                    <>
                      <Check className="h-3 w-3 stroke-[3]" />
                      Eating
                    </>
                  ) : (
                    'Skipped'
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Days of Week Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all tap-target ${
                isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Meal Slots Feed */}
      <div className="space-y-3">
        {[
          {
            type: 'Breakfast',
            time: '08:00 AM – 10:00 AM',
            color: 'border-amber-100 bg-amber-50/30 text-amber-800',
          },
          {
            type: 'Lunch',
            time: '12:30 PM – 02:30 PM',
            color: 'border-orange-100 bg-orange-50/30 text-orange-800',
          },
          {
            type: 'Dinner',
            time: '08:00 PM – 10:00 PM',
            color: 'border-indigo-100 bg-indigo-50/30 text-indigo-800',
          },
        ].map((slot) => {
          const items = getMealMenu(selectedDay, slot.type);
          return (
            <div
              key={slot.type}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-xl px-2.5 py-1 text-xs font-bold ${slot.color}`}>
                    {slot.type}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                  <Clock className="h-3 w-3" />
                  {slot.time}
                </span>
              </div>

              {items.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {items.map((item, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-brandText border border-gray-100"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic pt-1">
                  Menu not uploaded for this meal by PG manager.
                </p>
              )}
            </div>
          );
        })}
      </div>

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
