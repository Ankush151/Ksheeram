import { OrderStatus, OrderType, PackageSize, PackagingType, PaymentMethod, PaymentStatus } from '../enums';
export interface OrderItemDto {
    productId: string;
    variantId?: string;
    productName: string;
    size: PackageSize;
    packagingType: PackagingType;
    quantity: number;
    unitPricePaise: number;
    subtotalPaise: number;
}
export interface OrderDto {
    id: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    orderType: OrderType;
    status: OrderStatus;
    stockAllocated: boolean;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    items: OrderItemDto[];
    addressId?: string;
    deliveryAddress: string;
    pincode: string;
    deliveryDate: string;
    deliverySlot: string;
    subtotalPaise: number;
    deliveryFeePaise: number;
    totalPaise: number;
    assignedAgentId?: string;
    assignedAgentName?: string;
    deliveryInstructions?: string;
    failedReason?: string;
    subscriptionId?: string;
    idempotencyKey?: string;
    createdAt: string;
    updatedAt: string;
}
export interface CreateOrderDto {
    items: {
        productId: string;
        size: PackageSize;
        packagingType?: PackagingType;
        quantity: number;
    }[];
    addressId: string;
    deliveryDate: string;
    deliverySlot?: string;
    paymentMethod: PaymentMethod;
    instructions?: string;
    idempotencyKey?: string;
}
export interface CheckoutQuoteDto {
    items: OrderItemDto[];
    subtotalPaise: number;
    deliveryFeePaise: number;
    totalPaise: number;
    isWalletSufficient: boolean;
    currentWalletBalancePaise: number;
}
//# sourceMappingURL=orders.dto.d.ts.map