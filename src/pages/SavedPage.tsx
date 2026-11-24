import React, { useState, useEffect } from 'react';
import { Bookmark, Search, LogIn, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchService, type PropertyListItem } from '../services/searchService';
import { PropertyCard } from '../components/search/PropertyCard';
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

  // If guest / not logged in
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 text-center px-4 animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-primary mb-4 shadow-sm">
          <Bookmark className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-brandText">Save Your Favorite PGs</h2>
        <p className="mt-2 max-w-xs text-xs text-brandText-muted leading-relaxed">
          Sign in to save and compare properties, track rent quotes, and access your shortlisted PGs on any device.
        </p>

        <button
          onClick={() => navigate('/login')}
          className="mt-6 flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark active:scale-95 transition-all tap-target"
        >
          <LogIn className="h-4 w-4" />
          Sign In with Phone
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1 pb-6 animate-fade-in">
      <div className="page-toolbar flex items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-lg font-bold text-brandText">Saved Properties</h2>
          <p className="text-xs text-brandText-muted">
            {savedPgs.length} {savedPgs.length === 1 ? 'property' : 'properties'} shortlisted
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSaved}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
          title="Refresh saved properties"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error ? (
        <InlineError message={error} onRetry={fetchSaved} />
      ) : loading ? (
        <ListSkeleton rows={3} />
      ) : savedPgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-16 text-center px-4 animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-primary mb-4 shadow-sm">
            <Bookmark className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-bold text-brandText">No Saved PGs Yet</h3>
          <p className="mt-2 max-w-xs text-xs text-brandText-muted leading-relaxed">
            Tap the bookmark icon on any PG card while browsing to save it to your personal shortlist.
          </p>

          <button
            onClick={() => navigate('/search')}
            className="mt-6 flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark active:scale-95 transition-all tap-target"
          >
            <Search className="h-4 w-4" />
            Explore Properties
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {savedPgs.map((pg) => (
            <PropertyCard
              key={pg.id}
              property={{ ...pg, isBookmarked: true }}
              onBookmarkChanged={(bookmarked) => {
                if (!bookmarked) {
                  setSavedPgs((prev) => prev.filter((item) => item.id !== pg.id));
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
