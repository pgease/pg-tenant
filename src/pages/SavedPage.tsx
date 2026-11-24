import React, { useState, useEffect } from 'react';
import { Bookmark, Search, LogIn, RefreshCw, MapPin, Building2, CalendarCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchService, type PropertyListItem } from '../services/searchService';
import { ListSkeleton } from '../components/ui/ListSkeleton';
import { InlineError } from '../components/ui/InlineError';

export const SavedPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [savedPgs, setSavedPgs] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSaved = () => {
    if (isAuthenticated) {
      setLoading(true);
      setError(null);
      searchService
        .getBookmarks()
        .then((res) => {
          setSavedPgs(Array.isArray(res) ? res : []);
        })
        .catch((err) => {
          console.error('Failed to load bookmarks:', err);
          setError('Could not load your saved properties. Please check your network and try again.');
          setSavedPgs([]);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setError(null);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, [isAuthenticated]);

  const handleUnsave = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setSavedPgs((prev) => prev.filter((item) => item.id !== id));
      await searchService.toggleBookmark(id);
    } catch {
      fetchSaved();
    }
  };

  // If guest / not logged in
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 text-center px-4 animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-[#008080] mb-4 shadow-sm">
          <Bookmark className="h-10 w-10 fill-[#008080]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Save Your Favorite PGs</h2>
        <p className="mt-2 max-w-xs text-xs text-gray-500 leading-relaxed">
          Sign in to save and compare verified properties, track prices, and access your shortlisted PGs on any device.
        </p>

        <button
          onClick={() => navigate('/login')}
          className="mt-6 flex items-center gap-2 rounded-2xl bg-[#008080] px-8 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-[#006666] active:scale-95 transition-all cursor-pointer"
        >
          <LogIn className="h-4 w-4" />
          Sign In with Phone
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1 pb-8 animate-fade-in">
      {/* Header with dynamic count and Pull-to-refresh (T6) */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Saved Properties</h2>
          <p className="text-xs text-gray-500">
            {savedPgs.length} {savedPgs.length === 1 ? 'property' : 'properties'} saved
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSaved}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 shadow-2xs cursor-pointer"
          title="Refresh saved properties"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#008080]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error ? (
        <InlineError message={error} onRetry={fetchSaved} />
      ) : loading ? (
        <ListSkeleton rows={3} />
      ) : savedPgs.length === 0 ? (
        /* Empty state (T6) */
        <div className="flex flex-col items-center justify-center pt-16 text-center px-4 animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-[#008080] mb-4 shadow-sm">
            <Bookmark className="h-10 w-10 text-[#008080]" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No saved properties yet</h3>
          <p className="mt-2 max-w-xs text-xs text-gray-500 leading-relaxed">
            Shortlist verified PGs while browsing to compare sharing types and book visits.
          </p>

          <button
            onClick={() => navigate('/search')}
            className="mt-6 flex items-center gap-2 rounded-2xl bg-[#008080] px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-teal-900/15 hover:bg-[#006666] active:scale-95 transition-all cursor-pointer"
          >
            <Search className="h-4 w-4" />
            <span>Explore verified PGs near you</span>
          </button>
        </div>
      ) : (
        /* 16:9 Property Cards (T6) */
        <div className="space-y-4">
          {savedPgs.map((pg) => {
            const coverPhoto = pg.photos && pg.photos.length > 0 ? pg.photos[0] : null;
            const startingPrice =
              pg.minPrice ||
              pg.startingRent ||
              pg.tripleSharingPrice ||
              pg.doubleSharingPrice ||
              pg.singleSharingPrice ||
              0;

            const sharingTypes = [
              pg.singleSharingPrice ? 'Single' : null,
              pg.doubleSharingPrice ? 'Double' : null,
              pg.tripleSharingPrice ? 'Triple' : null,
              pg.fourSharingPrice ? '4 Sharing' : null,
            ].filter(Boolean);

            const locationStr = pg.locality || pg.cityName || pg.city || pg.address || 'Location Verified';
            const targetUrl = `/pg/${pg.slug || pg.id}`;

            return (
              <div
                key={pg.id}
                onClick={() => navigate(targetUrl)}
                className="group cursor-pointer rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-teal-100 transition-all active:scale-[0.99]"
              >
                {/* 16:9 Image Container */}
                <div className="relative aspect-video w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                  {coverPhoto ? (
                    <img
                      src={coverPhoto}
                      alt={pg.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <Building2 className="h-12 w-12 text-slate-300" />
                  )}

                  {/* Bookmark icon top-right (filled teal to unsave per T6) */}
                  <button
                    type="button"
                    onClick={(e) => handleUnsave(e, pg.id)}
                    className="absolute top-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#008080] shadow-md hover:scale-105 active:scale-90 transition-all cursor-pointer"
                    title="Remove from saved"
                    aria-label="Remove from saved"
                  >
                    <Bookmark className="h-5 w-5 fill-[#008080]" />
                  </button>

                  {/* Starting Price Tag */}
                  <div className="absolute bottom-2.5 left-2.5 rounded-xl bg-black/60 backdrop-blur-md px-3 py-1 text-white">
                    <span className="text-xs font-medium text-teal-200">Starting from </span>
                    <span className="text-sm font-black tabular-nums">
                      {startingPrice > 0 ? `₹${startingPrice.toLocaleString('en-IN')}` : 'Contact'}
                    </span>
                    <span className="text-[10px] text-white/80">/mo</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-[#008080] transition-colors truncate">
                        {pg.name}
                      </h3>
                      <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{locationStr}</span>
                      </p>
                    </div>
                  </div>

                  {/* Sharing types available */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10.5px] font-semibold text-gray-500">Sharing:</span>
                    {(sharingTypes.length > 0 ? sharingTypes : ['Single', 'Double', 'Triple']).map((type) => (
                      <span
                        key={type}
                        className="rounded-lg bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-[#008080]"
                      >
                        {type}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons: View Details + Book Visit (T6) */}
                  <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(targetUrl);
                      }}
                      className="flex-1 rounded-xl border border-teal-200 bg-white py-2 px-3 text-xs font-bold text-[#008080] hover:bg-teal-50 transition-colors text-center cursor-pointer"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`${targetUrl}?action=book-visit`);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#008080] py-2 px-3 text-xs font-bold text-white hover:bg-[#006666] shadow-xs transition-colors cursor-pointer"
                    >
                      <CalendarCheck className="h-3.5 w-3.5" />
                      <span>Book Visit</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
