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
    customDays?: number[];
    items: SubscriptionItemDto[];
    addressId: string;
    deliveryAddress: string;
    pincode: string;
    startDate: string;
    endDate?: string;
    nextDeliveryDate: string;
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
    startDate: string;
    deliverySlot?: string;
}
export interface PauseSubscriptionDto {
    pauseStartDate: string;
    pauseEndDate: string;
}
export interface UpdateSubscriptionScheduleDto {
    frequency?: SubscriptionFrequency;
    customDays?: number[];
    items?: {
        productId: string;
        size: PackageSize;
        quantity: number;
    }[];
    effectiveFromDate: string;
}
//# sourceMappingURL=subscriptions.dto.d.ts.map