import { apiClient } from './apiClient';

export interface PropertyListItem {
  id: string;
  name: string;
  propertyCode?: string;
  slug?: string;
  address?: string;
  city?: string;
  cityName?: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
  mobileContactNumber?: string;
  photos?: string[];
  singleSharingPrice?: number;
  doubleSharingPrice?: number;
  tripleSharingPrice?: number;
  fourSharingPrice?: number;
  startingRent?: number;
  minPrice?: number;
  averageRating?: number;
  noOfRatings?: number;
  propertyType?: string;
  pgTypeName?: string;
  gender?: string;
  isBookmarked?: boolean;
  distanceKm?: number;
  facilities?: string[];
  amenities?: Array<{ id?: string; name: string; iconUrl?: string }>;
  foodAvailable?: boolean;
  acAvailable?: boolean;
}

export interface SearchFilters {
  latitude?: number;
  longitude?: number;
  search?: string;
  city?: string;
  locality?: string;
  minPrice?: number;
  maxPrice?: number;
  gender?: string; // 'boys' | 'girls' | 'co-ed'
  sharingType?: string; // 'single' | 'double' | 'triple' | 'four_plus'
  amenities?: string[];
  foodAvailable?: boolean;
  acAvailable?: boolean;
  page?: number;
  limit?: number;
}

export const searchService = {
  /**
   * Search PGs using the live backend public search API
   */
  async searchPgs(filters: SearchFilters): Promise<{ properties: PropertyListItem[]; total: number }> {
    try {
      const params = new URLSearchParams();

      // Normalize city parameter for backend API
      if (filters.city && filters.city !== 'All') {
        const cityLower = filters.city.toLowerCase();
        if (cityLower.includes('delhi')) {
          params.append('location', 'Delhi');
        } else if (cityLower.includes('noida')) {
          params.append('location', 'Noida');
        } else if (cityLower.includes('ghaziabad')) {
          params.append('location', 'Ghaziabad');
        } else if (cityLower.includes('bangalore') || cityLower.includes('bengaluru')) {
          params.append('location', 'Bengaluru');
        } else {
          params.append('location', filters.city);
        }
      }

      if (filters.search && filters.search.trim()) {
        params.append('name', filters.search.trim());
        params.append('query', filters.search.trim());
      }
      if (filters.minPrice !== undefined && filters.minPrice > 0) {
        params.append('minRent', String(filters.minPrice));
      }
      if (filters.maxPrice !== undefined && filters.maxPrice < 50000) {
        params.append('maxRent', String(filters.maxPrice));
      }
      if (filters.gender && filters.gender !== 'all') {
        const g = filters.gender.toLowerCase();
        params.append('gender', g === 'boys' ? 'boys' : g === 'girls' ? 'girls' : 'co-ed');
      }
      if (filters.sharingType) {
        params.append('sharingType', filters.sharingType);
      }
      if (filters.foodAvailable) {
        params.append('foodAvailable', 'true');
      }
      if (filters.acAvailable) {
        params.append('acAvailable', 'true');
      }
      if (filters.amenities && filters.amenities.length > 0) {
        params.append('amenities', filters.amenities.join(','));
      }
      if (filters.latitude && filters.longitude) {
        params.append('latitude', String(filters.latitude));
        params.append('longitude', String(filters.longitude));
        params.append('distance', '50');
      }
      params.append('limit', String(filters.limit || 50));

      const { data } = await apiClient.get(`/properties/public/search?${params.toString()}`);

      const rawItems = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.data?.items)
        ? data.data.items
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];

      const properties: PropertyListItem[] = rawItems.map((item: any) => {
        const rents = [
          item.startingRent,
          item.priceStartingFrom,
          item.pricing?.fourSharing,
          item.pricing?.tripleSharing,
          item.pricing?.doubleSharing,
          item.pricing?.singleSharing,
          item.fourSharingPrice,
          item.tripleSharingPrice,
          item.doubleSharingPrice,
          item.singleSharingPrice,
          item.publicListingDetails?.pricing?.fourSharing?.withFood,
          item.publicListingDetails?.pricing?.triple?.withFood,
          item.publicListingDetails?.pricing?.double?.withFood,
          item.publicListingDetails?.pricing?.single?.withFood,
          item.publicListingDetails?.fourSharingPrice,
          item.publicListingDetails?.tripleSharingPrice,
          item.publicListingDetails?.doubleSharingPrice,
          item.publicListingDetails?.singleSharingPrice,
        ]
          .map(Number)
          .filter((n) => Number.isFinite(n) && n > 0);

        const minPrice = rents.length > 0 ? Math.min(...rents) : Number(item.startingRent) || 0;

        const photos =
          Array.isArray(item.photos) && item.photos.length > 0
            ? item.photos
            : Array.isArray(item.photoUrls) && item.photoUrls.length > 0
            ? item.photoUrls
            : Array.isArray(item.publicListingDetails?.photos) && item.publicListingDetails.photos.length > 0
            ? item.publicListingDetails.photos
            : [];

        const cityName =
          item.cityName ||
          item.city ||
          (item.address?.toLowerCase().includes('noida')
            ? 'Noida'
            : item.address?.toLowerCase().includes('ghaziabad')
            ? 'Ghaziabad'
            : item.address?.toLowerCase().includes('delhi')
            ? 'Delhi'
            : '');

        return {
          id: item.id,
          name: item.name || item.publicListingDetails?.propertyName || 'PG Property',
          propertyCode: item.propertyCode,
          slug: item.slug || item.id,
          address: item.address || item.publicListingDetails?.address || '',
          city: cityName,
          cityName: cityName,
          locality: item.locality || (item.address ? item.address.split(',')[1]?.trim() : cityName),
          latitude: Number(item.latitude) || undefined,
          longitude: Number(item.longitude) || undefined,
          mobileContactNumber: item.mobileContactNumber || item.contactNumber || item.publicListingDetails?.contactNumber,
          photos,
          singleSharingPrice: Number(item.singleSharingPrice || item.pricing?.singleSharing || item.publicListingDetails?.singleSharingPrice) || undefined,
          doubleSharingPrice: Number(item.doubleSharingPrice || item.pricing?.doubleSharing || item.publicListingDetails?.doubleSharingPrice) || undefined,
          tripleSharingPrice: Number(item.tripleSharingPrice || item.pricing?.tripleSharing || item.publicListingDetails?.tripleSharingPrice) || undefined,
          fourSharingPrice: Number(item.fourSharingPrice || item.pricing?.fourSharing || item.publicListingDetails?.fourSharingPrice) || undefined,
          minPrice,
          averageRating: item.averageRating ? Number(item.averageRating) : undefined,
          noOfRatings: item.noOfRatings ? Number(item.noOfRatings) : undefined,
          propertyType: item.propertyType || item.propertyTypeName || '',
          pgTypeName: item.propertyType || item.propertyTypeName || '',
          gender: item.gender,
          isBookmarked: Boolean(item.isBookmarked),
          distanceKm: item.distanceKm !== null && item.distanceKm !== undefined ? Number(item.distanceKm) : undefined,
          facilities: Array.isArray(item.amenities) && item.amenities.length > 0
            ? item.amenities.map((a: any) => (typeof a === 'string' ? a : a.name)).slice(0, 3)
            : Array.isArray(item.facilities)
            ? item.facilities.slice(0, 3)
            : [],
          amenities: Array.isArray(item.amenities)
            ? item.amenities.map((a: any) => (typeof a === 'string' ? { name: a } : a))
            : [],
        };
      });

      return {
        properties,
        total: data?.total || properties.length,
      };
    } catch (err) {
      console.error('Failed to search properties:', err);
      return { properties: [], total: 0 };
    }
  },

  /**
   * Get comprehensive public details of a property
   */
  async getPropertyDetails(idOrSlug: string): Promise<any> {
    try {
      const { data } = await apiClient.get(`/properties/public/${idOrSlug}`);
      if (data?.data) return data.data;
      if (data?.property) return data.property;
      return data;
    } catch {
      const { data } = await apiClient.get(`/tenants/properties/${idOrSlug}`);
      return data;
    }
  },

  /**
   * Save / Bookmark toggle
   */
  async toggleBookmark(propertyId: string): Promise<{ bookmarked: boolean }> {
    const { data } = await apiClient.post('/tenants/bookmarks', { propertyId });
    return data;
  },

  /**
   * Fetch tenant bookmarked properties
   */
  async getBookmarks(): Promise<PropertyListItem[]> {
    try {
      const { data } = await apiClient.get('/tenants/bookmarks');
      return Array.isArray(data) ? data : data.bookmarks || [];
    } catch {
      return [];
    }
  },

  /**
   * Analytics tracking for owner contact click
   */
  async recordContactClick(propertyId: string, type: 'call' | 'whatsapp' | 'share'): Promise<void> {
    try {
      await apiClient.post(`/public/pgs/${propertyId}/contact-click`, {
        type,
        source: 'tenant-web-app',
      });
    } catch {
      // Non-blocking analytics call
    }
  },
};
