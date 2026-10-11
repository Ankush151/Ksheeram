export type SubscriptionFrequency = 'daily' | 'alternate' | 'custom';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface AdminSubscription {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status: SubscriptionStatus;
  frequency: SubscriptionFrequency;
  customDays?: number[];
  items: {
    productId: string;
    productName: string;
    size: '500ml' | '1L';
    quantity: number;
    unitPrice: number;
  }[];
  deliveryAddress: string;
  pincode: string;
  startDate: string;
  nextDeliveryDate: string;
  pauseStartDate?: string;
  pauseEndDate?: string;
  walletBalance: number;
  isWalletSufficient: boolean;
  createdAt: string;
}
