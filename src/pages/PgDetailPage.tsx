import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Phone,
  MessageSquare,
  Bookmark,
  MapPin,
  Star,
  ShieldCheck,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { searchService } from '../services/searchService';
import { useAuth } from '../context/AuthContext';

export const PgDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (!idOrSlug) return;
    setLoading(true);
    setError(null);

    searchService
      .getPropertyDetails(idOrSlug)
      .then((data) => {
        setProperty(data);
        if (data.isBookmarked) setIsSaved(true);
      })
      .catch((err) => {
        console.error('Failed to load PG details:', err);
        setError('This PG listing could not be found or is not currently active.');
      })
      .finally(() => setLoading(false));
  }, [idOrSlug]);

  const handleShare = async () => {
    const slug = property?.slug || idOrSlug;
    const url = `https://pgease.com/pg/${slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.name || 'Verified PG on PG Ease',
          text: `Check out ${property?.name || 'this PG'} on PG Ease!`,
          url,
        });
        if (property?.id) searchService.recordContactClick(property.id, 'share');
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      if (property?.id) searchService.recordContactClick(property.id, 'share');
    }
  };

  const handleToggleBookmark = async () => {
    if (!isAuthenticated) {
      if (window.confirm('Please log in to save this PG to your bookmarks. Go to Login?')) {
        navigate('/login');
      }
      return;
    }

    if (!property?.id) return;
    try {
      const next = !isSaved;
      setIsSaved(next);
      await searchService.toggleBookmark(property.id);
    } catch {
      setIsSaved(!isSaved);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-brandText-muted">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p className="text-xs font-semibold">Loading PG details & pricing...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center space-y-4 pt-16">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-brandText">Property Not Available</h2>
        <p className="text-xs text-brandText-muted max-w-xs mx-auto">
          {error || 'This property may have been unpublished by the owner or removed from public listing.'}
        </p>
        <button
          onClick={() => navigate('/search')}
          className="rounded-xl bg-primary px-6 py-3 text-xs font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark tap-target"
        >
          Back to Search
        </button>
      </div>
    );
  }

  const photos =
    Array.isArray(property.photos) && property.photos.length > 0
      ? property.photos
      : [];

  const ownerPhone = property.mobileContactNumber || property.owner?.contactNumber;
  const mapUrl =
    property.latitude && property.longitude
      ? `https://maps.google.com/?q=${property.latitude},${property.longitude}`
      : `https://maps.google.com/?q=${encodeURIComponent(`${property.name} ${property.address || property.city || ''}`)}`;

  return (
    <div className="space-y-5 animate-fade-in pb-28">
      {/* 1. Header Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-brandText hover:bg-gray-200 active:scale-95 transition-all tap-target"
          title="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-brandText hover:bg-gray-200 active:scale-95 transition-all tap-target"
            title="Share PG"
          >
            {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
          </button>

          <button
            onClick={handleToggleBookmark}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 tap-target ${
              isSaved
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-brandText hover:bg-gray-200'
            }`}
            title="Save PG"
          >
            <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* 2. Photo Gallery Carousel */}
      <div className="relative overflow-hidden rounded-3xl bg-gray-100 shadow-md">
        <div className="h-64 w-full flex items-center justify-center bg-gray-100">
          {photos.length > 0 ? (
            <img
              src={photos[activePhotoIndex]}
              alt={property.name}
              className="h-full w-full object-cover transition-all duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <Building className="h-16 w-16 mb-2 text-gray-300" />
              <span className="text-xs font-semibold">No property photos uploaded by owner</span>
            </div>
          )}
        </div>

        {/* Photo Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
            {activePhotoIndex + 1} / {photos.length}
          </div>
        )}

        {/* Thumbnail Selector */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5 overflow-x-auto max-w-[70%] no-scrollbar">
            {photos.map((_item: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActivePhotoIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === activePhotoIndex ? 'w-6 bg-white' : 'w-2 bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Title & Basic Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Listing
          </span>

          {property.pgTypeName && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-brandText capitalize">
              {property.pgTypeName}
            </span>
          )}

          {property.averageRating ? (
            <div className="ml-auto flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>{property.averageRating.toFixed(1)}</span>
              {property.noOfRatings ? (
                <span className="text-[10px] text-brandText-muted">
                  ({property.noOfRatings})
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <h1 className="text-2xl font-black tracking-tight text-brandText leading-tight">
          {property.name}
        </h1>

        <p className="flex items-start gap-1 text-xs text-brandText-muted leading-relaxed">
          <MapPin className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
          <span>{property.address || property.locality || property.cityName || property.city || ''}</span>
        </p>

        {/* Directions Link */}
        <div className="pt-1">
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <span>View on Google Maps</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* 4. Room Sharing Rent Tiers */}
      {(property.singleSharingPrice || property.doubleSharingPrice || property.tripleSharingPrice || property.fourSharingPrice) ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-card-soft space-y-3">
          <h3 className="text-xs font-bold text-brandText uppercase tracking-wider">
            Rent by Sharing Type
          </h3>

          <div className="grid grid-cols-3 gap-2 text-center">
            {property.singleSharingPrice ? (
              <div className="rounded-2xl bg-teal-50/60 p-3 border border-teal-100/60">
                <span className="text-[11px] font-bold text-primary block">1 Sharing</span>
                <p className="text-base font-black text-brandText mt-1">
                  ₹{property.singleSharingPrice.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-brandText-muted block mt-0.5">per month</span>
              </div>
            ) : null}

            {property.doubleSharingPrice ? (
              <div className="rounded-2xl bg-amber-50/60 p-3 border border-amber-100/60">
                <span className="text-[11px] font-bold text-amber-700 block">2 Sharing</span>
                <p className="text-base font-black text-brandText mt-1">
                  ₹{property.doubleSharingPrice.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-brandText-muted block mt-0.5">per month</span>
              </div>
            ) : null}

            {property.tripleSharingPrice ? (
              <div className="rounded-2xl bg-gray-50 p-3 border border-gray-100">
                <span className="text-[11px] font-bold text-brandText block">3 Sharing</span>
                <p className="text-base font-black text-brandText mt-1">
                  ₹{property.tripleSharingPrice.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-brandText-muted block mt-0.5">per month</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* 5. Amenities & Facilities */}
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-card-soft space-y-3">
        <h3 className="text-xs font-bold text-brandText uppercase tracking-wider">
          Amenities & Living Perks
        </h3>

        {((property.amenities && property.amenities.length > 0) || (property.facilities && property.facilities.length > 0)) ? (
          <div className="grid grid-cols-2 gap-2.5">
            {[...(property.amenities || []), ...(property.facilities || [])].map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-brandText">
                <div className="h-6 w-6 rounded-lg bg-teal-50 flex items-center justify-center text-primary flex-shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <span>{typeof item === 'string' ? item : item.name || item}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">Amenities details available upon inquiry with property owner.</p>
        )}
      </div>

      {/* 6. House Rules */}
      {(property.houseRules || property.restrictions || property.gateClosingTime) && (
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-card-soft space-y-2.5">
          <h3 className="text-xs font-bold text-brandText uppercase tracking-wider">
            House Rules & Timings
          </h3>
          <div className="space-y-1.5 text-xs text-brandText-muted">
            {property.gateClosingTime && (
              <div className="flex items-center gap-2 text-amber-800 font-semibold bg-amber-50 p-2.5 rounded-xl">
                <Clock className="h-4 w-4 flex-shrink-0 text-amber-700" />
                <span>Curfew: Gate closes at {property.gateClosingTime}</span>
              </div>
            )}
            {Array.isArray(property.houseRules) ? (
              property.houseRules.map((rule: string, i: number) => (
                <p key={i}>• {rule}</p>
              ))
            ) : Array.isArray(property.restrictions) ? (
              property.restrictions.map((rule: string, i: number) => (
                <p key={i}>• {rule}</p>
              ))
            ) : property.houseRules ? (
              <p>• {property.houseRules}</p>
            ) : null}
          </div>
        </div>
      )}

      {/* 7. Bottom Fixed Contact Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md border-t border-gray-200 bg-white/95 px-4 py-3 pb-safe backdrop-blur-md shadow-2xl flex items-center gap-3">
        {ownerPhone ? (
          <>
            <a
              href={`https://wa.me/91${ownerPhone}?text=Hi,%20I%20am%20interested%20in%20${encodeURIComponent(property.name)}%20via%20PG%20Ease`}
              target="_blank"
              rel="noreferrer"
              onClick={() => searchService.recordContactClick(property.id, 'whatsapp')}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-emerald-500 bg-emerald-50 py-3.5 text-xs font-bold text-emerald-800 shadow-sm active:scale-95 transition-all tap-target"
            >
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              WhatsApp
            </a>

            <a
              href={`tel:+91${ownerPhone}`}
              onClick={() => searchService.recordContactClick(property.id, 'call')}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark active:scale-95 transition-all tap-target"
            >
              <Phone className="h-4 w-4" />
              Call Owner
            </a>
          </>
        ) : (
          <div className="w-full text-center text-xs font-semibold text-brandText-muted py-2">
            Owner contact available after booking inquiry
          </div>
        )}
      </div>
    </div>
  );
};
