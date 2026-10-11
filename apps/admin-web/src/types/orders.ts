export type OrderStatus = 'placed' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export interface AdminOrderItem {
  productId: string;
  productName: string;
  size: '500ml' | '1L';
  quantity: number;
  unitPrice: number;
  subtotal: number;
  totalPrice?: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  orderType: 'one_time' | 'subscription_delivery';
  status: OrderStatus;
  stockAllocated: boolean;
  paymentStatus: PaymentStatus;
  paymentMethod: 'upi' | 'card' | 'wallet' | 'cod';
  items: AdminOrderItem[];
  deliveryAddress: string;
  pincode: string;
  deliveryDate: string;
  deliverySlot: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  totalAmount?: number;
  assignedAgentId?: string;
  assignedAgentName?: string;
  deliveryInstructions?: string;
  instructions?: string;
  failedReason?: string;
  createdAt: string;
}
