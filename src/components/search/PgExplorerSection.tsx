import React, { useState, useEffect, useCallback } from 'react';
import {
  Search as SearchIcon,
  SlidersHorizontal,
  Crosshair,
  Loader2,
  Filter,
} from 'lucide-react';
import {
  searchService,
  type PropertyListItem,
  type SearchFilters,
} from '../../services/searchService';
import { PropertyCard } from './PropertyCard';
import { FilterDrawer } from './FilterDrawer';

const CITIES = ['All', 'Delhi NCR', 'Noida', 'Bangalore', 'Kolkata', 'Lucknow', 'Kota'];

interface PgExplorerSectionProps {
  title?: string;
  subtitle?: string;
  hideTitle?: boolean;
}

export const PgExplorerSection: React.FC<PgExplorerSectionProps> = ({
  title,
  subtitle,
  hideTitle = false,
}) => {
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filter chips state
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNearMe, setIsNearMe] = useState<boolean>(false);
  const [under10k, setUnder10k] = useState<boolean>(false);
  const [withFood, setWithFood] = useState<boolean>(false);
  const [acRooms, setAcRooms] = useState<boolean>(false);

  // Full Filters Object
  const [filters, setFilters] = useState<SearchFilters>({
    city: undefined,
  });

  const loadProperties = useCallback(async () => {
    setLoading(true);
    try {
      const activeFilters: SearchFilters = {
        city: selectedCity === 'All' ? undefined : selectedCity,
        search: searchQuery.trim() || undefined,
        maxPrice: under10k ? 10000 : filters.maxPrice,
        foodAvailable: withFood ? true : undefined,
        acAvailable: acRooms ? true : undefined,
        gender: filters.gender,
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
  }, [selectedCity, searchQuery, under10k, withFood, acRooms, filters]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Handle Geolocation Near Me
  const handleNearMeToggle = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    if (!isNearMe) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsNearMe(true);
          setFilters((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));
        },
        () => {
          alert('Could not access current location.');
        }
      );
    } else {
      setIsNearMe(false);
      setFilters((prev) => ({
        ...prev,
        latitude: undefined,
        longitude: undefined,
      }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bottom Sheet */}
      <FilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
      />

      {/* Optional Section Header */}
      {!hideTitle && title && (
        <div>
          <h2 className="text-lg font-bold tracking-tight text-brandText">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* 1. Search Bar with Sliders Icon Inside */}
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by location, PG name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-11 py-3 text-xs font-semibold text-brandText placeholder:text-gray-400 focus:border-primary focus:outline-none transition-all shadow-sm"
        />
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors tap-target flex items-center justify-center"
          title="Open Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Filter Pills Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {/* Filters button */}
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="flex-shrink-0 flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50/70 px-3 py-1.5 text-xs font-bold text-teal-800 transition-all tap-target"
        >
          <Filter className="h-3 w-3 text-primary" />
          <span>Filters</span>
        </button>

        {/* Near Me */}
        <button
          type="button"
          onClick={handleNearMeToggle}
          className={`flex-shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all tap-target ${
            isNearMe
              ? 'bg-primary text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Crosshair className="h-3 w-3" />
          <span>Near Me</span>
        </button>

        {/* Under ₹10K */}
        <button
          type="button"
          onClick={() => setUnder10k(!under10k)}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all tap-target ${
            under10k
              ? 'bg-primary text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Under ₹10K
        </button>

        {/* With Food */}
        <button
          type="button"
          onClick={() => setWithFood(!withFood)}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all tap-target ${
            withFood
              ? 'bg-primary text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          With Food
        </button>

        {/* AC Rooms */}
        <button
          type="button"
          onClick={() => setAcRooms(!acRooms)}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all tap-target ${
            acRooms
              ? 'bg-primary text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          AC Rooms
        </button>

        {/* City Chips */}
        {CITIES.map((city) => {
          const isSelected = selectedCity === city;
          return (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all tap-target ${
                isSelected
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {city}
            </button>
          );
        })}
      </div>

      {/* 3. Results Count Indicator */}
      <div className="px-1 text-xs text-gray-500 font-medium">
        {loading ? (
          <span>Searching PGs...</span>
        ) : (
          <span>
            {properties.length} {properties.length === 1 ? 'PG' : 'PGs'} found in{' '}
            {selectedCity === 'All' ? 'All Cities' : selectedCity}
          </span>
        )}
      </div>

      {/* Verified Listings Guarantee Banner */}
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50/60 p-3 border border-teal-100/80 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100/80 text-primary flex-shrink-0">
          <Crosshair className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-teal-900 flex items-center gap-1">
            PG Ease Verified Stays
          </p>
          <p className="text-[11px] text-teal-700/90 truncate">
            Zero brokerage, verified amenities & direct PG owner connect
          </p>
        </div>
      </div>

      {/* 4. Properties List Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-xs font-semibold text-gray-500">Loading verified properties...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/30 p-8 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100/80 text-primary">
            <SearchIcon className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brandText">No PGs Found</h3>
            <p className="text-xs text-brandText-muted mt-1 max-w-xs mx-auto leading-relaxed">
              No matching properties found with these specific filters. Try selecting 'All' or clearing filters!
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCity('All');
              setUnder10k(false);
              setWithFood(false);
              setAcRooms(false);
              setSearchQuery('');
            }}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark"
          >
            Show All Cities
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
            />
          ))}
        </div>
      )}
    </div>
  );
};
