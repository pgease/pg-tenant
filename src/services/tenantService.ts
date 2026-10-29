import { apiClient } from './apiClient';

export interface RentCollectionDetails {
  rentCollectionId: string;
  paymentLink?: string;
  status: 'paid' | 'partial' | 'pending';
  period: {
    month: number;
    year: number;
    label: string;
  };
  totalPayable: number;
  lineItems: {
    rent: { title: string; amount: number; isPaid: boolean; dueDay?: number };
    securityDeposit: { title: string; amount: number; isPaid: boolean };
    miscellaneous: { title: string; amount: number; description?: string; isPaid: boolean };
  };
  summary: {
    totalBilled: number;
    amountPaid: number;
    balanceDue: number;
  };
  settlement?: {
    upiQrString?: string;
    settlementUpiId?: string;
    settlementAccountHolder?: string;
    settlementAccountNumber?: string;
    settlementIfsc?: string;
    settlementBankName?: string;
  };
  owner?: {
    name?: string;
    contactNumber?: string;
  };
}

export interface Complaint {
  id: string;
  ticketNumber?: string;
  subject: string;
  description: string;
  category?: string;
  priority?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  photoUrl?: string;
  createdAt: string;
  updatedAt?: string;
  resolutionRemarks?: string;
}

export interface GuestRequest {
  id: string;
  guestName?: string;
  guestPhone?: string;
  expectedArrival: string;
  expectedDeparture?: string;
  numberOfGuests?: number;
  status: 'pending' | 'approved' | 'rejected';
  purpose?: string;
  createdAt: string;
}

export interface NightOutRequest {
  id: string;
  leaveDate: string;
  returnDate: string;
  reason: string;
  destinationAddress?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export const tenantService = {
  // Rent & Collections
  async getRentDues(): Promise<RentCollectionDetails> {
    const { data } = await apiClient.get('/tenants/rent-collections/my-dues');
    return data;
  },

  async getRentHistory(page = 1, limit = 20): Promise<any> {
    const { data } = await apiClient.get('/tenants/rent-collections/history', {
      params: { page, limit },
    });
    return data;
  },

  async createCheckoutOrder(collectionId: string, itemsPaid?: any): Promise<any> {
    const { data } = await apiClient.post(`/tenants/rent-collections/${collectionId}/checkout-order`, {
      itemsPaid,
    });
    return data;
  },

  async verifyPayment(dto: any): Promise<any> {
    const { data } = await apiClient.post('/tenants/rent-collections/verify-payment', dto);
    return data;
  },

  async uploadPhoto(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('photo', file);
    const { data } = await apiClient.post('/tenants/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.photo?.url || data.photo || data.url;
  },

  // Stay Amenities & WiFi
  async getWifiDetails(): Promise<any> {
    const { data } = await apiClient.get('/tenants/property/wifi-details');
    return data;
  },

  async getAmenitiesAndRestrictions(): Promise<any> {
    const { data } = await apiClient.get('/tenants/property/amenities-and-restrictions');
    return data;
  },

  async getDiningSchedule(): Promise<any> {
    const { data } = await apiClient.get('/tenants/dining-schedule');
    return data;
  },

  async getStaff(): Promise<any> {
    const { data } = await apiClient.get('/tenants/property/staff');
    return data;
  },

  // Notice Period
  async getNoticePeriod(): Promise<any> {
    const { data } = await apiClient.get('/tenants/notice-period');
    return data;
  },

  async raiseNotice(dto: { reason?: string; vacateOn?: string; remarks?: string }): Promise<any> {
    const { data } = await apiClient.post('/tenants/notice', dto);
    return data;
  },

  async cancelNotice(): Promise<any> {
    const { data } = await apiClient.post('/tenants/cancel-notice', {});
    return data;
  },

  // Complaints
  async getComplaints(): Promise<Complaint[]> {
    const { data } = await apiClient.get('/tenants/complaints');
    return Array.isArray(data) ? data : data.complaints || [];
  },

  async raiseComplaint(dto: {
    subject: string;
    description: string;
    category?: string;
    priority?: string;
    photoUrl?: string;
  }): Promise<Complaint> {
    const { data } = await apiClient.post('/tenants/raise-complaint', dto);
    return data;
  },

  // Guest Requests
  async getGuestRequests(): Promise<GuestRequest[]> {
    const { data } = await apiClient.get('/tenants/guest-requests');
    return Array.isArray(data) ? data : data.requests || [];
  },

  async createGuestRequest(dto: any): Promise<GuestRequest> {
    const { data } = await apiClient.post('/tenants/guest-requests', dto);
    return data;
  },

  // Night Out Requests
  async getNightOutRequests(): Promise<NightOutRequest[]> {
    const { data } = await apiClient.get('/tenants/night-out-requests');
    return Array.isArray(data) ? data : data.requests || [];
  },

  async createNightOutRequest(dto: any): Promise<NightOutRequest> {
    const { data } = await apiClient.post('/tenants/night-out-requests', dto);
    return data;
  },

  // Agreements & Notices
  async getAgreements(): Promise<any[]> {
    const { data } = await apiClient.get('/tenants/agreements/my-agreements');
    return Array.isArray(data) ? data : data.agreements || [];
  },

  async getNotices(): Promise<any[]> {
    const { data } = await apiClient.get('/tenants/notices');
    return Array.isArray(data) ? data : data.notices || [];
  },
};
