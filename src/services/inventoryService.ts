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

const DEFAULT_BED_ITEMS: TenantInventoryItem[] = [
  { id: 'ti_1', name: 'Single Bed Frame & Base', category: 'furniture', level: 'bed', qty: 1, condition: 'good', shared: false, valueInr: 4500 },
  { id: 'ti_2', name: 'Comfort Foam Mattress (6-inch)', category: 'bedding', level: 'bed', qty: 1, condition: 'new', shared: false, valueInr: 2500 },
  { id: 'ti_3', name: 'Sleeping Pillow', category: 'bedding', level: 'bed', qty: 1, condition: 'new', shared: false, valueInr: 350 },
  { id: 'ti_4', name: 'Wardrobe / Personal Almirah', category: 'furniture', level: 'bed', qty: 1, condition: 'good', shared: false, valueInr: 5000, serialOrTag: 'ALM-02' },
  { id: 'ti_5', name: 'Study Desk & Chair', category: 'furniture', level: 'bed', qty: 1, condition: 'good', shared: false, valueInr: 2600 },
  { id: 'ti_6', name: 'Almirah Key (Original)', category: 'other', level: 'bed', qty: 1, condition: 'good', shared: false, valueInr: 100 },
];

const DEFAULT_ROOM_ITEMS: TenantInventoryItem[] = [
  { id: 'ti_10', name: '1.5 Ton Split Inverter AC', category: 'appliance', level: 'room', qty: 1, condition: 'new', shared: true, valueInr: 32000, serialOrTag: 'AC-301' },
  { id: 'ti_11', name: 'Instant Geyser (25L)', category: 'appliance', level: 'room', qty: 1, condition: 'good', shared: true, valueInr: 6000 },
  { id: 'ti_12', name: 'High-Speed Ceiling Fan', category: 'electrical', level: 'room', qty: 1, condition: 'good', shared: true, valueInr: 1800 },
  { id: 'ti_13', name: 'LED Tube Light Battens', category: 'electrical', level: 'room', qty: 2, condition: 'new', shared: true, valueInr: 700 },
  { id: 'ti_14', name: 'Room Entry Key', category: 'other', level: 'room', qty: 1, condition: 'good', shared: true, valueInr: 150 },
];

export const inventoryService = {
  async getTenantInventory(tenantId: string, roomNo = '301', bedNo = '1'): Promise<TenantInventorySnapshot> {
    try {
      const response = await apiClient.get<TenantInventorySnapshot>(`/t/${tenantId}/inventory`);
      return response.data;
    } catch {
      // Local fallback representation
      const stored = localStorage.getItem(`tenant_inv_${tenantId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      const snapshot: TenantInventorySnapshot = {
        agreementId: `agr_${tenantId}`,
        roomNumber: roomNo,
        bedNumber: bedNo,
        handoverDate: 'At Move-In',
        hash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        bedItems: DEFAULT_BED_ITEMS,
        roomItems: DEFAULT_ROOM_ITEMS,
        allResolved: [...DEFAULT_BED_ITEMS, ...DEFAULT_ROOM_ITEMS],
      };
      localStorage.setItem(`tenant_inv_${tenantId}`, JSON.stringify(snapshot));
      return snapshot;
    }
  },

  async getCheckoutSummary(tenantId: string): Promise<TenantCheckoutSummary> {
    try {
      const response = await apiClient.get<TenantCheckoutSummary>(`/t/${tenantId}/checkout/inventory`);
      return response.data;
    } catch {
      const ackStatus = localStorage.getItem(`tenant_checkout_ack_${tenantId}`);
      const disputeNote = localStorage.getItem(`tenant_checkout_dispute_${tenantId}`) || undefined;

      return {
        securityDeposit: 10000,
        pendingRentDues: 0,
        totalDeductions: 500,
        refundAmount: 9500,
        balanceDueAmount: 0,
        isBalanceDue: false,
        status: (ackStatus as any) || 'pending',
        disputeNote,
        inspectedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        items: [
          { name: 'Single Bed Frame & Base', shared: false, status: 'ok', qtyReturned: 1, totalQty: 1, conditionAtMoveIn: 'good', deductionInr: 0 },
          { name: 'Comfort Foam Mattress', shared: false, status: 'ok', qtyReturned: 1, totalQty: 1, conditionAtMoveIn: 'new', deductionInr: 0 },
          { name: 'Wardrobe / Personal Almirah', shared: false, status: 'ok', qtyReturned: 1, totalQty: 1, conditionAtMoveIn: 'good', deductionInr: 0 },
          { name: 'Almirah Key', shared: false, status: 'damaged', qtyReturned: 1, totalQty: 1, conditionAtMoveIn: 'good', deductionInr: 500, note: 'Slightly bent key replaced' },
          { name: '1.5 Ton Split AC', shared: true, status: 'not_applicable', qtyReturned: 1, totalQty: 1, conditionAtMoveIn: 'new', deductionInr: 0 },
        ],
      };
    }
  },

  async acknowledgeCheckout(
    tenantId: string,
    payload: { agree: boolean; disputeNote?: string }
  ): Promise<{ success: boolean; status: 'agreed' | 'disputed' }> {
    try {
      const response = await apiClient.post(`/t/${tenantId}/checkout/inventory-ack`, payload);
      return response.data;
    } catch {
      const status = payload.agree ? 'agreed' : 'disputed';
      localStorage.setItem(`tenant_checkout_ack_${tenantId}`, status);
      if (payload.disputeNote) {
        localStorage.setItem(`tenant_checkout_dispute_${tenantId}`, payload.disputeNote);
      }
      return { success: true, status };
    }
  },
};

