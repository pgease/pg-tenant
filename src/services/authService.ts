import { apiClient } from './apiClient';

export interface OtpRequestPayload {
  mobileNumber: string;
  countryCode?: string;
  channel?: 'whatsapp' | 'sms';
}

export interface OtpVerifyPayload {
  mobileNumber: string;
  otp: string;
  name?: string;
  intent?: 'searching' | 'already_in_pg' | string;
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
  tenant?: {
    id: string;
    name?: string;
    phone?: string;
    email?: string;
    [key: string]: any;
  } | null;
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
    monthlyRent?: number;
    [key: string]: any;
  } | null;
  bed?: {
    id: string;
    bedNumber: string | number;
    status?: string;
  } | null;
  roomTenant?: {
    id: string;
    monthlyRent?: number;
    rentAmount?: number;
    securityDeposit?: number;
    joiningDate?: string;
    startDate?: string;
    status?: string;
    isOnNotice?: boolean;
    noticeStartedAt?: string;
    vacateOn?: string;
    [key: string]: any;
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
  async requestOtp(payload: OtpRequestPayload): Promise<{ success?: boolean; message: string; isNewUser?: boolean }> {
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
      name: payload.name,
      intent: payload.intent,
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
  async updateProfile(payload: { name?: string; email?: string; intent?: string }): Promise<any> {
    const { data } = await apiClient.patch('/tenants/profile', payload);
    return data;
  },

  /**
   * Upload / update tenant profile photo
   */
  async uploadProfilePhoto(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('photo', file);
    const { data } = await apiClient.post('/tenants/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};
