import React, { useState } from 'react';
import { X, SlidersHorizontal, Check, RotateCcw } from 'lucide-react';
import type { SearchFilters } from '../../services/searchService';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
}

const GENDERS = [
  { id: 'all', label: 'All PGs' },
  { id: 'boys', label: 'Boys' },
  { id: 'girls', label: 'Girls' },
  { id: 'co-live', label: 'Co-Live' },
];

const SHARING_TYPES = [
  { id: 'single', label: '1 Sharing' },
  { id: 'double', label: '2 Sharing' },
  { id: 'triple', label: '3 Sharing' },
  { id: 'four_plus', label: '4+ Sharing' },
];

const AMENITIES_LIST = [
  'WiFi',
  'Food Included',
  'Air Conditioning (AC)',
  'Power Backup',
  'RO Drinking Water',
  'Washing Machine',
  'Attached Washroom',
  'CCTV Security',
  'Daily Cleaning',
  'Geyser',
];

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
}) => {
  const [selectedGender, setSelectedGender] = useState<string>(filters.gender || 'all');
  const [selectedSharing, setSelectedSharing] = useState<string>(filters.sharingType || '');
  const [minPrice, setMinPrice] = useState<number>(filters.minPrice || 4000);
  const [maxPrice, setMaxPrice] = useState<number>(filters.maxPrice || 25000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(filters.amenities || []);

  if (!isOpen) return null;

  const toggleAmenity = (item: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleReset = () => {
    setSelectedGender('all');
    setSelectedSharing('');
    setMinPrice(4000);
    setMaxPrice(25000);
    setSelectedAmenities([]);
  };

  const handleApply = () => {
    onApply({
      ...filters,
      gender: selectedGender === 'all' ? undefined : selectedGender,
      sharingType: selectedSharing || undefined,
      minPrice,
      maxPrice,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-md max-h-[90dvh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center text-primary font-bold">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brandText">Search Filters</h2>
              <p className="text-[11px] text-brandText-muted">Refine your PG search</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-brandText-muted hover:text-brandText tap-target"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filters Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* 1. Gender Allowed */}
          <div>
            <label className="block text-xs font-bold text-brandText uppercase tracking-wider mb-2">
              PG Type (Gender)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {GENDERS.map((g) => {
                const active = selectedGender === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGender(g.id)}
                    className={`rounded-xl py-2 px-1 text-xs font-bold transition-all tap-target ${
                      active
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-gray-200 bg-gray-50/50 text-brandText-muted hover:text-brandText'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Monthly Rent Range */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-brandText uppercase tracking-wider">
                Monthly Rent Range
              </label>
              <span className="text-xs font-black text-primary">
                ₹{minPrice.toLocaleString('en-IN')} – ₹{maxPrice.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-3">
              <input
                type="range"
                min={3000}
                max={30000}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-gray-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-brandText-muted font-medium">
                <span>₹3,000</span>
                <span>₹15,000</span>
                <span>₹30,000+</span>
              </div>
            </div>
          </div>

          {/* 3. Sharing Room Type */}
          <div>
            <label className="block text-xs font-bold text-brandText uppercase tracking-wider mb-2">
              Room Sharing
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SHARING_TYPES.map((st) => {
                const active = selectedSharing === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedSharing(active ? '' : st.id)}
                    className={`rounded-xl py-2.5 px-3 text-xs font-bold transition-all tap-target ${
                      active
                        ? 'border-2 border-primary bg-primary-50 text-primary shadow-sm'
                        : 'border border-gray-200 bg-white text-brandText-muted hover:text-brandText'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Amenities */}
          <div>
            <label className="block text-xs font-bold text-brandText uppercase tracking-wider mb-2">
              Included Amenities & Food
            </label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all tap-target ${
                      isSelected
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-gray-200 bg-gray-50/50 text-brandText-muted hover:border-gray-300'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 border-t border-gray-100 p-4 bg-white">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-brandText hover:bg-gray-50 active:scale-95 tap-target"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-xl bg-primary py-3.5 text-xs font-bold text-white shadow-md shadow-primary/25 hover:bg-primary-dark active:scale-[0.98] tap-target"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
