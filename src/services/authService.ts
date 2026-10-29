import { apiClient } from './apiClient';

export interface OtpRequestPayload {
  mobileNumber: string;
  countryCode?: string;
  channel?: 'whatsapp' | 'sms';
}

export interface OtpVerifyPayload {
  mobileNumber: string;
  otp: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tenant: {
    id: string;
    numericId?: number;
    name?: string;
    phone: string;
    countryCode?: string;
    isFirstTimeUser?: boolean;
    [key: string]: any;
  };
  isFirstTimeUser?: boolean;
}

export interface TenancyDetailsResponse {
  isAddedToProperty: boolean;
  message?: string;
  property?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    locality?: string;
    pincode?: string;
    coverPhoto?: string;
    contactNumber?: string;
    [key: string]: any;
  } | null;
  room?: {
    id: string;
    roomNumber: string;
    floorNumber?: number;
    sharingType?: string;
  } | null;
  bed?: {
    id: string;
    bedNumber: string | number;
    status?: string;
  } | null;
  roomTenant?: {
    id: string;
    monthlyRent?: number;
    securityDeposit?: number;
    joiningDate?: string;
    status?: string;
  } | null;
  notice?: any | null;
  wifi?: {
    ssid?: string;
    password?: string;
    details?: string;
  } | null;
  amenities?: string[];
  facilities?: string[];
  restrictions?: string[];
  staff?: any[];
  isRentDue?: boolean;
  isRentPaidForCurrentPeriod?: boolean | null;
  currentPeriodPayment?: any;
  nextRentDueDate?: string | null;
  daysUntilDue?: number | null;
  daysOverdue?: number | null;
}

export const authService = {
  /**
   * Request OTP via WhatsApp or SMS
   */
  async requestOtp(payload: OtpRequestPayload): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post('/tenants/otp/request', {
      mobileNumber: payload.mobileNumber,
      countryCode: payload.countryCode || '+91',
      channel: payload.channel || 'whatsapp',
      isWhatsApp: payload.channel === 'whatsapp',
    });
    return data;
  },

  /**
   * Verify 4-digit OTP and login
   */
  async verifyOtp(payload: OtpVerifyPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/tenants/otp/verify', {
      mobileNumber: payload.mobileNumber,
      otp: payload.otp,
    });
    return data;
  },

  /**
   * Fetch active tenancy linking details
   */
  async getTenancyDetails(): Promise<TenancyDetailsResponse> {
    const { data } = await apiClient.get<TenancyDetailsResponse>('/tenants/get-property-details');
    return data;
  },

  /**
   * Fetch tenant profile details
   */
  async getProfile(): Promise<any> {
    const { data } = await apiClient.get('/tenants/profile');
    return data;
  },

  /**
   * Update tenant profile details
   */
  async updateProfile(payload: { name?: string; email?: string }): Promise<any> {
    try {
      const { data } = await apiClient.patch('/tenants/profile', payload);
      return data;
    } catch {
      // Fallback update
      return payload;
    }
  },
};
