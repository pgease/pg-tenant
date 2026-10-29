import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  SlidersHorizontal,
  Bell,
  Pencil,
  Loader2,
  X,
  Building2,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Utensils,
  CreditCard,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchService, type PropertyListItem, type SearchFilters } from '../services/searchService';
import { PropertyCard } from '../components/search/PropertyCard';
import { FilterDrawer } from '../components/search/FilterDrawer';
import { authService } from '../services/authService';

const CITIES = ['All', 'Delhi NCR', 'Noida', 'Bangalore', 'Kolkata', 'Lucknow', 'Kota'];

export const HomePage: React.FC = () => {
  const {
    isAuthenticated,
    isLinkedTenant,
    propertyDetails,
    checkTenancy,
    tenant,
  } = useAuth();
  const navigate = useNavigate();

  // Search & Filter state
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Quick Filter Chips
  const [genderFilter, setGenderFilter] = useState<string | undefined>(undefined);
  const [withFood, setWithFood] = useState<boolean>(false);
  const [acRooms, setAcRooms] = useState<boolean>(false);
  const [under10k, setUnder10k] = useState<boolean>(false);

  // Full Filters Object for Filter Drawer
  const [filters, setFilters] = useState<SearchFilters>({});

  // Edit Name Modal State
  const [showEditNameModal, setShowEditNameModal] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(tenant?.name || '');
  const [savingName, setSavingName] = useState<boolean>(false);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    try {
      const activeFilters: SearchFilters = {
        city: selectedCity === 'All' ? undefined : selectedCity,
        search: searchQuery.trim() || undefined,
        gender: genderFilter,
        foodAvailable: withFood ? true : undefined,
        acAvailable: acRooms ? true : undefined,
        maxPrice: under10k ? 10000 : filters.maxPrice,
        sharingType: filters.sharingType,
        amenities: filters.amenities,
      };

      const res = await searchService.searchPgs(activeFilters);
      setProperties(res.properties);
    } catch (err) {
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCity, searchQuery, genderFilter, withFood, acRooms, under10k, filters]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProperties();
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      await authService.updateProfile({ name: nameInput.trim() });
      await checkTenancy();
      setShowEditNameModal(false);
    } catch (err) {
      console.error('Failed to update name:', err);
    } finally {
      setSavingName(false);
    }
  };

  const displayName = tenant?.name || (isAuthenticated ? 'Resident' : 'Explore PGs');

  return (
    <div className="space-y-5 pt-1 pb-6 animate-fade-in">
      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          loadProperties();
        }}
      />

      {/* Edit Name Modal */}
      {showEditNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Your Full Name</h3>
              <button
                onClick={() => setShowEditNameModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveName} className="space-y-3">
              <input
                type="text"
                placeholder="Enter your name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 focus:border-[#008080] focus:outline-none"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditNameModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingName || !nameInput.trim()}
                  className="flex-1 rounded-xl bg-[#008080] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#006b6b] disabled:opacity-50"
                >
                  {savingName ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Top Header Row */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-xs font-medium text-gray-500">
            {isAuthenticated ? 'Welcome back,' : 'Welcome to PG Ease,'}
          </p>
          <button
            type="button"
            onClick={() => {
              if (isAuthenticated) {
                setNameInput(tenant?.name || '');
                setShowEditNameModal(true);
              } else {
                navigate('/login');
              }
            }}
            className="flex items-center gap-1.5 text-base font-black text-[#008080] tracking-tight hover:underline text-left mt-0.5"
          >
            <span>{displayName}</span>
            {isAuthenticated && <Pencil className="h-3.5 w-3.5 text-[#008080]" />}
          </button>
        </div>

        {/* Right Actions: Avatar + Notification Bell */}
        <div className="flex items-center gap-2.5">
          <div
            onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-primary/40 bg-teal-50 text-xs font-bold text-[#008080] shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            {tenant?.name ? tenant.name.slice(0, 2).toUpperCase() : 'PG'}
          </div>

          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-600 shadow-sm hover:bg-gray-50 active:scale-95 transition-all tap-target"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
        </div>
      </div>

      {/* Linked PG Active Banner (if user already linked) */}
      {isLinkedTenant && (
        <div
          onClick={() => navigate('/my-pg')}
          className="cursor-pointer rounded-2xl bg-gradient-to-r from-[#008080] to-[#005f5f] p-4 text-white shadow-md shadow-[#008080]/15 flex items-center justify-between active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200">
                Your Active PG Stay
              </span>
              <h4 className="text-sm font-bold text-white truncate max-w-[200px]">
                {propertyDetails?.property?.name || 'Linked PG Stay'}
              </h4>
              <p className="text-[11px] text-white/80">
                {propertyDetails?.room?.roomNumber ? `Room ${propertyDetails.room.roomNumber}` : 'Room Assigned'} • Tap to view details
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/80" />
        </div>
      )}

      {/* 2. Attractive Hero Mascot Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#008080] via-[#006666] to-[#004D4D] p-5 text-white shadow-xl shadow-[#008080]/20">
        {/* Soft Background Glows */}
        <div className="absolute -right-6 -bottom-6 h-36 w-36 rounded-full bg-white/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex-1 space-y-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-teal-100 backdrop-blur-md">
              <Sparkles className="h-3 w-3" />
              <span>Zero Brokerage Stays</span>
            </span>

            <h2 className="text-lg font-black tracking-tight leading-snug">
              Find Your Perfect PG & Hostel
            </h2>

            <p className="text-xs text-white/80 leading-relaxed line-clamp-2">
              Verified amenities, daily meals, fast Wi-Fi, and instant owner connect across India.
            </p>

            <button
              onClick={() => navigate('/search')}
              className="inline-flex items-center gap-1 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-[#008080] shadow-md hover:bg-gray-50 active:scale-95 transition-all"
            >
              <span>Explore Verified PGs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Official PG Ease 3D Mascot Character */}
          <div className="flex-shrink-0 w-24 h-28 relative">
            <img
              src="/assets/mascot.jpg"
              alt="PG Ease Mascot"
              className="w-full h-full object-contain rounded-2xl filter drop-shadow-md"
            />
          </div>
        </div>
      </div>

      {/* 3. Search Bar with Sliders Filter Button */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#008080]" />
          <input
            type="text"
            placeholder="Search by city, locality, or PG name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:border-[#008080] focus:outline-none transition-all shadow-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-[#008080] hover:text-[#008080] active:scale-95 transition-all tap-target"
          title="Open Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </form>

      {/* 4. Quick Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {/* Boys PG */}
        <button
          type="button"
          onClick={() => setGenderFilter(genderFilter === 'boys' ? undefined : 'boys')}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all tap-target ${
            genderFilter === 'boys'
              ? 'bg-[#008080] text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          👦 Boys PG
        </button>

        {/* Girls PG */}
        <button
          type="button"
          onClick={() => setGenderFilter(genderFilter === 'girls' ? undefined : 'girls')}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all tap-target ${
            genderFilter === 'girls'
              ? 'bg-[#008080] text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          👧 Girls PG
        </button>

        {/* Co-ed */}
        <button
          type="button"
          onClick={() => setGenderFilter(genderFilter === 'co-ed' ? undefined : 'co-ed')}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all tap-target ${
            genderFilter === 'co-ed'
              ? 'bg-[#008080] text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          👫 Co-ed
        </button>

        {/* With Food */}
        <button
          type="button"
          onClick={() => setWithFood(!withFood)}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all tap-target ${
            withFood
              ? 'bg-[#008080] text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          🍽️ With Food
        </button>

        {/* AC Rooms */}
        <button
          type="button"
          onClick={() => setAcRooms(!acRooms)}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all tap-target ${
            acRooms
              ? 'bg-[#008080] text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          ❄️ AC Rooms
        </button>

        {/* Under ₹10k */}
        <button
          type="button"
          onClick={() => setUnder10k(!under10k)}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all tap-target ${
            under10k
              ? 'bg-[#008080] text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          💰 Under ₹10k
        </button>
      </div>

      {/* 5. City Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {CITIES.map((city) => {
          const isSelected = selectedCity === city;
          return (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all tap-target ${
                isSelected
                  ? 'bg-teal-900 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {city}
            </button>
          );
        })}
      </div>

      {/* 6. Why PG Ease? Trust Badges */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm flex items-start gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-[#008080] flex-shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">Zero Brokerage</h4>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
              Direct connection with verified owners
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm flex items-start gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-[#008080] flex-shrink-0">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">Meal Schedules</h4>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
              Live daily breakfast, lunch & dinner timings
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm flex items-start gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-[#008080] flex-shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">Digital Rent</h4>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
              Zero hassle UPI settlements & rent receipts
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm flex items-start gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-[#008080] flex-shrink-0">
            <Wifi className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">High-Speed Wi-Fi</h4>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
              One-tap access to hostel Wi-Fi pass
            </p>
          </div>
        </div>
      </div>

      {/* 7. Verified & Nearby PGs Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              {selectedCity === 'All' ? 'Nearby & Featured PGs' : `PGs in ${selectedCity}`}
            </h3>
            <p className="text-[11px] text-gray-400">
              {loading ? 'Searching...' : `${properties.length} verified stays available`}
            </p>
          </div>

          <button
            onClick={() => navigate('/search')}
            className="text-xs font-bold text-[#008080] hover:underline flex items-center gap-0.5"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#008080] mb-2" />
            <p className="text-xs font-semibold text-gray-400">Loading verified properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center space-y-3">
            <Building2 className="mx-auto h-9 w-9 text-gray-300" />
            <div>
              <p className="text-xs font-bold text-gray-700">No PGs found in {selectedCity}</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                Try selecting 'All' or clearing filters to view properties in other cities.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCity('All');
                setGenderFilter(undefined);
                setWithFood(false);
                setAcRooms(false);
                setUnder10k(false);
                setSearchQuery('');
              }}
              className="rounded-xl bg-[#008080] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#006b6b]"
            >
              Show All Cities
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
