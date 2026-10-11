import { Address } from './addresses';
import { PackageSize } from './products';

export type OrderStatus = 'placed' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type OrderType = 'one_time' | 'subscription_delivery';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod';

export interface OrderItem {
  productId: string;
  productName: string;
  variantId: string;
  size: PackageSize;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface TimelineStep {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface OrderQuoteRequest {
  items: {
    productId: string;
    variantId: string;
    quantity: number;
  }[];
  addressId: string;
  couponCode?: string;
}

export interface OrderQuoteResponse {
  subtotal: number;
  deliveryFee: number;
  packagingFee: number;
  discountAmount: number;
  taxes: number;
  total: number;
  deliveryDate: string;
  deliverySlot: string;
  estimatedDeliveryWindow: string; // "Tomorrow before 7:00 AM"
  stockAvailable: boolean;
  unavailableItems?: string[];
}

export interface CreateOrderPayload {
  items: {
    productId: string;
    variantId: string;
    quantity: number;
  }[];
  deliveryAddressId: string;
  paymentMethod: PaymentMethod;
  deliveryInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  address: Address;
  deliveryDate: string;
  deliverySlot: string;
  subtotal: number;
  deliveryFee: number;
  packagingFee: number;
  discount: number;
  taxes: number;
  total: number;
  timeline: TimelineStep[];
  invoiceNumber?: string;
  invoiceUrl?: string;
  deliveryNotes?: string;
  driverName?: string;
  driverPhone?: string;
  createdAt: string;
  updatedAt: string;
}
