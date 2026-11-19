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
    qrImageUrl?: string | null;
    upiId?: string;
    settlementUpiId?: string;
    accountHolderName?: string;
    settlementAccountHolder?: string;
    accountNumber?: string;
    accountNumberMasked?: string;
    settlementAccountNumber?: string;
    ifscCode?: string;
    settlementIfsc?: string;
    bankName?: string;
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

export interface IndividualGuestItem {
  name: string;
  phone?: string;
  gender?: string;
  relationship?: string;
}

export interface GuestRequest {
  id: string;
  guestName?: string;
  guestPhone?: string;
  guestGender?: string;
  relationship?: string;
  guests?: IndividualGuestItem[];
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

  async uploadPhoto(file: File, folder?: string): Promise<string> {
    const formData = new FormData();
    formData.append('photo', file);
    const url = folder ? `/tenants/upload-photo?folder=${encodeURIComponent(folder)}` : '/tenants/upload-photo';
    const { data } = await apiClient.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.photo?.url || data.photo || data.url;
  },

  async uploadPaymentProof(file: File): Promise<string> {
    return this.uploadPhoto(file, 'payment-proofs');
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
    const items = Array.isArray(data) ? data : data?.data || data?.requests || [];
    return Array.isArray(items) ? items : [];
  },

  async createGuestRequest(dto: any): Promise<GuestRequest> {
    const { data } = await apiClient.post('/tenants/guest-requests', dto);
    return data;
  },

  // Night Out Requests
  async getNightOutRequests(): Promise<NightOutRequest[]> {
    const { data } = await apiClient.get('/tenants/night-out-requests');
    const items = Array.isArray(data) ? data : data?.data || data?.requests || [];
    return Array.isArray(items) ? items : [];
  },

  async createNightOutRequest(dto: any): Promise<NightOutRequest> {
    const { data } = await apiClient.post('/tenants/night-out-requests', dto);
    return data;
  },

  // Agreements & Notices
  async getAgreements(): Promise<any[]> {
    const { data } = await apiClient.get('/tenants/agreements/my-agreements');
    const items = Array.isArray(data) ? data : data?.data || data?.agreements || [];
    return Array.isArray(items) ? items : [];
  },

  async getNotices(): Promise<any[]> {
    const { data } = await apiClient.get('/tenants/notices');
    const items = Array.isArray(data) ? data : data?.data || data?.notices || [];
    return Array.isArray(items) ? items : [];
  },

  // Easebuzz Gateway Integration
  async getEasebuzzConfig(): Promise<{ available: boolean; checkoutMode: 'hosted' | 'seamless_upi'; reason?: string }> {
    try {
      const { data } = await apiClient.get('/tenants/payments/easebuzz/config');
      return data;
    } catch {
      return { available: false, checkoutMode: 'hosted', reason: 'Service unavailable' };
    }
  },

  async createEasebuzzPayment(dto: { dueIds?: string[]; checkoutMode?: 'hosted' | 'seamless_upi' } = {}): Promise<{
    success: boolean;
    txnid: string;
    checkoutMode: 'hosted' | 'seamless_upi';
    checkoutUrl?: string;
    accessKey: string;
    amount: string;
    currency: string;
  }> {
    const { data } = await apiClient.post('/tenants/payments/easebuzz/create', dto);
    return data;
  },

  async getEasebuzzPaymentStatus(txnid: string): Promise<{
    txnid: string;
    status: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
    settlementStatus?: string;
    amount: string;
    currency: string;
    easepayid?: string;
    bankRefNum?: string;
    utr?: string;
    mode?: string;
    paidAt?: string;
    createdAt?: string;
  }> {
    const { data } = await apiClient.get(`/tenants/payments/easebuzz/${encodeURIComponent(txnid)}/status`);
    return data;
  },

  async initiateSeamlessUpi(
    txnid: string,
    body: { method: 'collect' | 'qr'; upiId?: string },
  ): Promise<any> {
    const { data } = await apiClient.post(`/tenants/payments/easebuzz/${encodeURIComponent(txnid)}/upi`, body);
    return data;
  },

  // Aadhaar KYC DigiLocker status (TW-03, TW-11)
  async getKycStatus(): Promise<{
    isKycVerified: boolean;
    status: string;
    verifiedAt?: string;
    verifiedDetails?: {
      aadhaar?: {
        last4?: string;
        name?: string;
      };
    };
    directLink?: string;
  } | null> {
    try {
      const { data } = await apiClient.get('/tenants/kyc');
      return data?.kyc || data || null;
    } catch {
      return null;
    }
  },

  // Payment Options & Direct UPI (TW-08)
  async getPaymentOptions(): Promise<any> {
    try {
      const { data } = await apiClient.get('/tenants/payments/options');
      return data;
    } catch {
      return null;
    }
  },

  // Submit Manual / Offline Payment with 12-digit UTR (TW-08)
  async submitManualPayment(dto: {
    amount: number | string;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
    photoUrl?: string;
    rentCollectionId?: string;
  }): Promise<any> {
    const { data } = await apiClient.post('/tenants/payments/manual', dto);
    return data;
  },

  // Payment Receipt Download (TW-15)
  async getPaymentReceipt(paymentId: string): Promise<any> {
    const { data } = await apiClient.get(`/tenants/payments/${encodeURIComponent(paymentId)}/receipt`);
    return data;
  },
};
