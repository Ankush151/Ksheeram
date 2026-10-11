import { Address } from './addresses';
import { PackageSize } from './products';

export type SubscriptionFrequency = 'daily' | 'alternate' | 'custom';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';

export interface SubscriptionItem {
  productId: string;
  productName: string;
  variantId: string;
  size: PackageSize;
  quantity: number;
  unitPrice: number;
}

export interface Subscription {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  frequency: SubscriptionFrequency;
  customDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  items: SubscriptionItem[];
  deliveryAddressId: string;
  deliveryAddress: Address;
  startDate: string;
  nextDeliveryDate: string;
  pauseStartDate?: string;
  pauseEndDate?: string;
  autoRenew: boolean;
  paymentMethod: 'prepaid_wallet' | 'upi_autopay' | 'card';
  monthlyEstimate: number;
  cutoffTime: string; // e.g. "8:00 PM for next morning 7:00 AM delivery"
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionQuoteRequest {
  items: {
    productId: string;
    variantId: string;
    quantity: number;
  }[];
  frequency: SubscriptionFrequency;
  customDays?: number[];
  durationDays?: number; // default 30 days billing cycle
  addressId: string;
}

export interface SubscriptionQuoteResponse {
  perDeliveryTotal: number;
  estimatedDeliveriesPerMonth: number;
  monthlyTotal: number;
  bottleDeposit: number;
  discountAmount: number;
  taxAmount: number;
  totalPayableNow: number;
  currency: string;
  validUntil: string;
  canDeliverToPincode: boolean;
  pincodeDeliveryMessage?: string;
}

export interface CreateSubscriptionPayload {
  items: {
    productId: string;
    variantId: string;
    quantity: number;
  }[];
  frequency: SubscriptionFrequency;
  customDays?: number[];
  deliveryAddressId: string;
  startDate: string;
  paymentMethod: 'prepaid_wallet' | 'upi_autopay' | 'card';
}

export interface SubscriptionChangeRequest {
  requestedQuantity?: number;
  requestedFrequency?: SubscriptionFrequency;
  requestedCustomDays?: number[];
  effectiveDate: string; // YYYY-MM-DD
  reason?: string;
}

export interface SubscriptionChangeResult {
  success: boolean;
  effectiveFrom: string;
  affectsNextDelivery: boolean;
  message: string;
  updatedSubscription: Subscription;
}

export interface SubscriptionPauseRequest {
  pauseStartDate: string;
  resumeDate: string;
  reason?: string;
}

export interface SubscriptionResumeRequest {
  resumeDate: string;
}

export interface SubscriptionCancelRequest {
  reason: string;
  feedback?: string;
  effectiveImmediate?: boolean;
}
