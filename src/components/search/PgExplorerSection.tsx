import React, { useState, useEffect, useCallback } from 'react';
import {
  Search as SearchIcon,
  SlidersHorizontal,
  Crosshair,
  Filter,
} from 'lucide-react';
import {
  searchService,
  type PropertyListItem,
  type SearchFilters,
} from '../../services/searchService';
import { PropertyCard } from './PropertyCard';
import { FilterDrawer } from './FilterDrawer';
import { ListSkeleton } from '../ui/ListSkeleton';

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
  const [loadError, setLoadError] = useState<boolean>(false);
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
    setLoadError(false);
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
      setLoadError(true);
      setProperties([]);
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
          maxLength={100}
          placeholder="Search by location, PG name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value.slice(0, 100))}
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
      <div className="flex items-center gap-2 overflow-x-auto overscroll-x-contain no-scrollbar py-1 px-0.5">
        {/* Filters button */}
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="flex-shrink-0 flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50/70 px-3.5 py-1.5 text-xs font-bold text-teal-800 transition-all active:scale-95 whitespace-nowrap min-w-fit"
        >
          <Filter className="h-3 w-3 text-primary" />
          <span>Filters</span>
        </button>

        {/* Near Me */}
        <button
          type="button"
          onClick={handleNearMeToggle}
          className={`flex-shrink-0 flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 whitespace-nowrap min-w-fit ${
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
          className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 whitespace-nowrap min-w-fit ${
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
          className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 whitespace-nowrap min-w-fit ${
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
          className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 whitespace-nowrap min-w-fit ${
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
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 whitespace-nowrap min-w-fit ${
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

      {/* 3. Results Count Indicator (Shown ONLY after successful load when items exist) */}
      {!loading && !loadError && properties.length > 0 && (
        <div className="px-1 text-xs text-gray-500 font-medium">
          <span>
            {properties.length} {properties.length === 1 ? 'PG' : 'PGs'} found in{' '}
            {selectedCity === 'All' ? 'All Cities' : selectedCity}
          </span>
        </div>
      )}

      {/* 4. Properties List Feed */}
      {loading ? (
        <div className="space-y-2">
          <ListSkeleton rows={3} />
          <p className="text-center text-xs font-semibold text-gray-500">Loading verified properties...</p>
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center space-y-3 shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-[#008080] border border-teal-100">
            <SearchIcon className="h-6 w-6 text-[#008080]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1F2937]">Could not load PGs</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              Please check your connection and try again.
            </p>
          </div>
          <button
            type="button"
            onClick={loadProperties}
            className="inline-flex items-center justify-center rounded-xl bg-[#008080] hover:bg-[#005F5F] px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors active:scale-95 cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/30 p-8 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100/80 text-primary">
            <SearchIcon className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brandText">No PGs listed here yet</h3>
            <p className="text-xs text-brandText-muted mt-1 max-w-xs mx-auto leading-relaxed">
              No matching properties found with these filters. Try selecting 'All' or clearing filters.
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
