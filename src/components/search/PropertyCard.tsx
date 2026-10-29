import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  CheckCircle2,
  Bookmark,
  Building,
} from 'lucide-react';
import { type PropertyListItem, searchService } from '../../services/searchService';
import { useAuth } from '../../context/AuthContext';

interface PropertyCardProps {
  property: PropertyListItem;
  onBookmarkChanged?: (bookmarked: boolean) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onBookmarkChanged,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState<boolean>(property.isBookmarked || false);

  const coverPhoto = property.photos && property.photos.length > 0 ? property.photos[0] : null;

  const startingPrice =
    property.minPrice ||
    property.startingRent ||
    property.tripleSharingPrice ||
    property.doubleSharingPrice ||
    property.singleSharingPrice ||
    0;

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      if (window.confirm('Please sign in to save your favorite PGs. Go to Login?')) {
        navigate('/login');
      }
      return;
    }

    try {
      const nextState = !isSaved;
      setIsSaved(nextState);
      await searchService.toggleBookmark(property.id);
      onBookmarkChanged?.(nextState);
    } catch {
      setIsSaved(!isSaved);
    }
  };

  const handleCardClick = () => {
    const targetSlugOrId = property.slug || property.id;
    navigate(`/pg/${targetSlugOrId}`);
  };

  const tags =
    property.facilities && property.facilities.length > 0
      ? property.facilities
      : property.amenities && property.amenities.length > 0
      ? property.amenities.map((a: any) => (typeof a === 'string' ? a : a.name)).filter(Boolean)
      : [];

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-3 shadow-card-soft hover:shadow-md hover:border-teal-100 transition-all active:scale-[0.99] flex gap-3"
    >
      {/* 1. Square Thumbnail Image */}
      <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center">
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={property.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <Building className="h-10 w-10 text-gray-300" />
        )}

        {/* Bookmark heart/icon */}
        <button
          type="button"
          onClick={handleToggleBookmark}
          className={`absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full shadow-sm backdrop-blur-md transition-all active:scale-90 ${
            isSaved
              ? 'bg-primary text-white'
              : 'bg-white/80 text-gray-600 hover:bg-white'
          }`}
          title={isSaved ? 'Remove from Saved' : 'Save PG'}
        >
          <Bookmark className="h-3.5 w-3.5" fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* 2. Details */}
      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
        <div>
          {/* Title Row + Verified Badge + Star Rating */}
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-brandText group-hover:text-primary transition-colors truncate">
                {property.name}
              </h3>
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 fill-emerald-100" />
            </div>

            {property.averageRating ? (
              <div className="flex items-center gap-0.5 rounded-lg bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 flex-shrink-0">
                <Star className="h-3 w-3 text-teal-600 fill-teal-600" />
                <span>{property.averageRating.toFixed(1)}</span>
              </div>
            ) : null}
          </div>

          {/* Location Pin */}
          <p className="flex items-center gap-1 text-[11px] text-gray-500 truncate mt-1">
            <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
            <span className="truncate">
              {property.locality || property.cityName || property.city || property.address || ''}
            </span>
          </p>

          {/* Feature Badges */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-600 truncate max-w-[80px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price & View Button Row */}
        <div className="flex items-center justify-between border-t border-gray-50 pt-2 mt-1">
          <div className="flex items-baseline gap-0.5">
            {startingPrice > 0 ? (
              <>
                <span className="text-xs sm:text-sm font-black text-brandText">
                  ₹{startingPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">/month</span>
              </>
            ) : (
              <span className="text-xs font-bold text-gray-500">Contact for rent</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCardClick}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-1 text-xs font-bold text-brandText shadow-sm hover:border-primary hover:text-primary active:scale-95 transition-all"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
};
