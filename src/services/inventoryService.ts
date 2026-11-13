import { apiClient } from './apiClient';

export interface TenantInventoryItem {
  id: string;
  name: string;
  category: 'furniture' | 'appliance' | 'electrical' | 'bedding' | 'other';
  level: 'room' | 'bed';
  qty: number;
  condition: 'new' | 'good' | 'fair';
  serialOrTag?: string;
  valueInr?: number;
  photoUrls?: string[];
  shared: boolean;
}

export interface TenantInventorySnapshot {
  agreementId?: string;
  roomNumber: string;
  bedNumber: string;
  handoverDate: string;
  hash?: string;
  bedItems: TenantInventoryItem[];
  roomItems: TenantInventoryItem[];
  allResolved: TenantInventoryItem[];
}

export interface CheckoutInventoryInspectionItem {
  name: string;
  shared: boolean;
  status: 'ok' | 'damaged' | 'missing' | 'not_applicable';
  qtyReturned: number;
  totalQty: number;
  conditionAtMoveIn: string;
  deductionInr: number;
  note?: string;
}

export interface TenantCheckoutSummary {
  securityDeposit: number;
  pendingRentDues: number;
  totalDeductions: number;
  refundAmount: number;
  balanceDueAmount: number;
  isBalanceDue: boolean;
  status: 'pending' | 'agreed' | 'disputed';
  disputeNote?: string;
  inspectedAt?: string;
  items: CheckoutInventoryInspectionItem[];
}

export const inventoryService = {
  async getTenantInventory(tenantId: string, roomNo = '', bedNo = ''): Promise<TenantInventorySnapshot> {
    if (!tenantId) {
      return {
        roomNumber: roomNo,
        bedNumber: bedNo,
        handoverDate: '',
        bedItems: [],
        roomItems: [],
        allResolved: [],
      };
    }
    try {
      const response = await apiClient.get<TenantInventorySnapshot>(`/t/${tenantId}/inventory`);
      return response.data || {
        roomNumber: roomNo,
        bedNumber: bedNo,
        handoverDate: '',
        bedItems: [],
        roomItems: [],
        allResolved: [],
      };
    } catch {
      return {
        roomNumber: roomNo,
        bedNumber: bedNo,
        handoverDate: '',
        bedItems: [],
        roomItems: [],
        allResolved: [],
      };
    }
  },

  async getCheckoutSummary(tenantId: string): Promise<TenantCheckoutSummary | null> {
    if (!tenantId) return null;
    try {
      const response = await apiClient.get<TenantCheckoutSummary>(`/t/${tenantId}/checkout/inventory`);
      return response.data || null;
    } catch {
      return null;
    }
  },

  async acknowledgeCheckout(
    tenantId: string,
    payload: { agree: boolean; disputeNote?: string }
  ): Promise<{ success: boolean; status: 'agreed' | 'disputed' }> {
    const response = await apiClient.post(`/t/${tenantId}/checkout/inventory-ack`, payload);
    return response.data;
  },
};

