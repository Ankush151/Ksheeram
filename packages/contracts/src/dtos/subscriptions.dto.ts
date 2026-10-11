import { PackageSize, SubscriptionFrequency, SubscriptionStatus } from '../enums';

export interface SubscriptionItemDto {
  productId: string;
  variantId?: string;
  productName: string;
  size: PackageSize;
  quantity: number;
  unitPricePaise: number;
}

export interface SubscriptionDto {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status: SubscriptionStatus;
  frequency: SubscriptionFrequency;
  customDays?: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  items: SubscriptionItemDto[];
  addressId: string;
  deliveryAddress: string;
  pincode: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  nextDeliveryDate: string; // YYYY-MM-DD
  pauseStartDate?: string;
  pauseEndDate?: string;
  deliverySlot: string;
  walletBalancePaise: number;
  isWalletSufficient: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionDto {
  frequency: SubscriptionFrequency;
  customDays?: number[];
  items: {
    productId: string;
    size: PackageSize;
    quantity: number;
  }[];
  addressId: string;
  startDate: string; // YYYY-MM-DD
  deliverySlot?: string;
}

export interface PauseSubscriptionDto {
  pauseStartDate: string; // YYYY-MM-DD
  pauseEndDate: string; // YYYY-MM-DD
}

export interface UpdateSubscriptionScheduleDto {
  frequency?: SubscriptionFrequency;
  customDays?: number[];
  items?: {
    productId: string;
    size: PackageSize;
    quantity: number;
  }[];
  effectiveFromDate: string; // YYYY-MM-DD
}
