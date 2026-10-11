import { DeliveryFailureReason, DeliveryStatus, PackageSize, PaymentMethod, PaymentStatus } from '../enums';
export interface ManifestOrderItemDto {
    orderId: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    pincode: string;
    deliveryInstructions?: string;
    items: {
        productName: string;
        size: PackageSize;
        quantity: number;
    }[];
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    amountToCollectPaise: number;
    status: DeliveryStatus;
    assignedAgentId?: string;
    assignedAgentName?: string;
    deliveryDate: string;
    deliverySlot: string;
    deliveredAt?: string;
    failedReason?: string;
    agentNotes?: string;
}
export interface AssignAgentDto {
    orderIds: string[];
    agentId: string;
}
export interface CompleteDeliveryDto {
    orderId: string;
    cashCollectedPaise?: number;
    agentNotes?: string;
}
export interface FailDeliveryDto {
    orderId: string;
    reason: DeliveryFailureReason;
    notes?: string;
}
//# sourceMappingURL=delivery.dto.d.ts.map