import React, { useState, useEffect } from 'react';
import { X, Utensils, Clock, Coffee, Sun, Sunset, Moon, Loader2 } from 'lucide-react';
import { tenantService } from '../../services/tenantService';

interface DiningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_MENU: Record<string, { breakfast: string; lunch: string; snacks: string; dinner: string }> = {
  Monday: {
    breakfast: 'Poha, Boiled Eggs / Banana, Tea / Coffee',
    lunch: 'Dal Tadka, Seasonal Veg, Steamed Rice, Roti, Salad',
    snacks: 'Samosa / Biscuits, Ginger Chai',
    dinner: 'Paneer Butter Masala, Jeera Rice, Chapati, Kheer',
  },
  Tuesday: {
    breakfast: 'Idli, Sambar, Coconut Chutney, Tea / Coffee',
    lunch: 'Rajma Masala, Aloo Gobi, Basmati Rice, Phulka',
    snacks: 'Bread Pakora, Hot Tea',
    dinner: 'Egg Curry / Mix Veg, Rice, Roti, Gulab Jamun',
  },
  Wednesday: {
    breakfast: 'Aloo Paratha with Curd & Pickle, Tea',
    lunch: 'Chole Masala, Bhature / Rice, Boondi Raita',
    snacks: 'Veg Cutlet, Tea / Coffee',
    dinner: 'Chicken Curry / Shahi Paneer, Pulao, Paratha',
  },
  Thursday: {
    breakfast: 'Upma, Medu Vada, Sambar, Filter Coffee',
    lunch: 'Kadhi Pakora, Jeera Aloo, Steamed Rice, Roti',
    snacks: 'Pappad / Mixture, Chai',
    dinner: 'Dal Makhani, Veg Biryani, Butter Roti, Ice Cream',
  },
  Friday: {
    breakfast: 'Masala Dosa, Sambhar, Chutney, Tea',
    lunch: 'Veg Biryani / Pulav, Cucumber Raita, Salan',
    snacks: 'Poha / French Fries, Masala Chai',
    dinner: 'Matar Paneer, Tawa Roti, Rice, Fruit Custard',
  },
  Saturday: {
    breakfast: 'Poori Bhaji, Halwa, Tea / Coffee',
    lunch: 'Dal Fry, Bhindi Masala, Steamed Rice, Phulka',
    snacks: 'Onion Pakoda, Hot Tea',
    dinner: 'Special Biryani (Veg/Chicken), Mirchi Ka Salan, Raita',
  },
  Sunday: {
    breakfast: 'Chole Kulche, Sweet Lassi / Tea',
    lunch: 'Special Sunday Thali, Paneer, Dal, Sweet',
    snacks: 'Maggi / Sweet Corn, Tea',
    dinner: 'Light Khichdi, Kadhi, Papad, Pickle, Sweet',
  },
};

export const DiningModal: React.FC<DiningModalProps> = ({ isOpen, onClose }) => {
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [menuData, setMenuData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const todayIndex = new Date().getDay(); // 0 is Sunday
      const dayName = todayIndex === 0 ? 'Sunday' : DAYS[todayIndex - 1];
      setSelectedDay(dayName);

      setLoading(true);
      tenantService
        .getDiningSchedule()
        .then((res) => {
          if (res && res.schedule) setMenuData(res.schedule);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentMenu =
    menuData && menuData[selectedDay] ? menuData[selectedDay] : DEFAULT_MENU[selectedDay];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-md max-h-[92dvh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 font-bold">
              <Utensils className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brandText">Dining & Food Menu</h2>
              <p className="text-[11px] text-brandText-muted">Weekly Schedule & Serving Timings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-brandText-muted hover:text-brandText tap-target"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Days Selector Carousel */}
        <div className="flex overflow-x-auto gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/50 no-scrollbar">
          {DAYS.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all tap-target ${
                  isSelected
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                    : 'bg-white text-brandText-muted border border-gray-200 hover:text-brandText'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
        </div>

        {/* Meals List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Breakfast */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
                    <Coffee className="h-4 w-4" />
                    <span>Breakfast</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-brandText-muted">
                    <Clock className="h-3 w-3" />
                    7:30 AM – 10:00 AM
                  </span>
                </div>
                <p className="text-xs font-medium text-brandText pl-6 pt-1">
                  {currentMenu.breakfast}
                </p>
              </div>

              {/* Lunch */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Sun className="h-4 w-4" />
                    <span>Lunch</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-brandText-muted">
                    <Clock className="h-3 w-3" />
                    12:30 PM – 2:30 PM
                  </span>
                </div>
                <p className="text-xs font-medium text-brandText pl-6 pt-1">
                  {currentMenu.lunch}
                </p>
              </div>

              {/* Evening Snacks */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                    <Sunset className="h-4 w-4" />
                    <span>Evening Snacks & Chai</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-brandText-muted">
                    <Clock className="h-3 w-3" />
                    5:00 PM – 6:30 PM
                  </span>
                </div>
                <p className="text-xs font-medium text-brandText pl-6 pt-1">
                  {currentMenu.snacks}
                </p>
              </div>

              {/* Dinner */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                    <Moon className="h-4 w-4" />
                    <span>Dinner</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-brandText-muted">
                    <Clock className="h-3 w-3" />
                    8:00 PM – 10:30 PM
                  </span>
                </div>
                <p className="text-xs font-medium text-brandText pl-6 pt-1">
                  {currentMenu.dinner}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
