import { apiClient } from '@/services/api-client';
import { mockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import {
  Order,
  OrderQuoteRequest,
  OrderQuoteResponse,
  CreateOrderPayload,
} from '@/types/orders';
import { Address } from '@/types/addresses';

function mapOrder(o: any): Order {
  const addrStr = typeof o.deliveryAddress === 'string' ? o.deliveryAddress : (o.deliveryAddress?.buildingName || 'Bengaluru');
  const address: Address = {
    id: o.addressId || '',
    userId: o.customerId || '',
    label: 'Delivery Address',
    addressType: 'home',
    flatNumber: '',
    buildingName: addrStr,
    streetArea: '',
    landmark: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: o.pincode || '560038',
    deliveryInstructions: o.deliveryInstructions || '',
    isDefault: true,
  };

  const items = (o.items || []).map((i: any) => ({
    productId: i.productId || '',
    productName: i.productName || 'Farm Fresh Milk',
    variantId: i.variantId || '',
    size: i.size || '1L',
    quantity: i.quantity || 1,
    unitPrice: i.unitPricePaise !== undefined ? i.unitPricePaise / 100 : (i.unitPrice || 68),
    subtotal: i.subtotalPaise !== undefined ? i.subtotalPaise / 100 : (i.subtotal || 68),
  }));

  const steps = [
    { status: 'placed', title: 'Order Placed', description: 'Order confirmed into scheduled route', isCompleted: true, isCurrent: o.status === 'placed' },
    { status: 'confirmed', title: 'Scheduled & Confirmed', description: 'Order prepared for morning batch', isCompleted: ['confirmed', 'packed', 'out_for_delivery', 'delivered'].includes(o.status), isCurrent: o.status === 'confirmed' },
    { status: 'packed', title: 'Bottled & Chilled (4°C)', description: 'Chilled in cold-chain facility', isCompleted: ['packed', 'out_for_delivery', 'delivered'].includes(o.status), isCurrent: o.status === 'packed' },
    { status: 'out_for_delivery', title: 'Out For Delivery', description: 'Delivery agent en route (5:30 AM – 7:00 AM)', isCompleted: ['out_for_delivery', 'delivered'].includes(o.status), isCurrent: o.status === 'out_for_delivery' },
    { status: 'delivered', title: 'Doorstep Delivered', description: 'Fresh milk placed in milk box', isCompleted: o.status === 'delivered', isCurrent: o.status === 'delivered' },
  ];

  return {
    id: o.id || o._id,
    orderNumber: o.orderNumber,
    userId: o.customerId || '',
    orderType: o.orderType || 'one_time',
    status: o.status || 'placed',
    paymentStatus: o.paymentStatus || 'paid',
    paymentMethod: o.paymentMethod || 'upi',
    items,
    address,
    deliveryDate: o.deliveryDate || new Date().toISOString().split('T')[0],
    deliverySlot: o.deliverySlot || 'Morning 5:30 AM – 7:00 AM',
    subtotal: o.subtotalPaise !== undefined ? o.subtotalPaise / 100 : (o.subtotal || 0),
    deliveryFee: o.deliveryFeePaise !== undefined ? o.deliveryFeePaise / 100 : (o.deliveryFee || 0),
    packagingFee: 0,
    discount: 0,
    taxes: 0,
    total: o.totalPaise !== undefined ? o.totalPaise / 100 : (o.total || 0),
    timeline: steps as any,
    driverName: o.assignedAgentName,
    driverPhone: '9876543211',
    createdAt: o.createdAt || new Date().toISOString(),
    updatedAt: o.updatedAt || new Date().toISOString(),
  };
}

export const ordersApi = {
  async getOrders(): Promise<Order[]> {
    if (env.USE_MOCK_API) {
      return mockHandlers.getOrders();
    }
    const res = await apiClient.get<any[]>('/orders');
    return (res || []).map(mapOrder);
  },

  async getOrderById(id: string): Promise<Order> {
    if (env.USE_MOCK_API) {
      return mockHandlers.getOrderById(id);
    }
    const res = await apiClient.get<any>(`/orders/${id}`);
    return mapOrder(res);
  },

  async quoteOrder(payload: OrderQuoteRequest): Promise<OrderQuoteResponse> {
    if (env.USE_MOCK_API) {
      return mockHandlers.quoteOrder(payload);
    }
    const res = await apiClient.post<any>('/orders/quote', payload);
    return {
      subtotal: (res.subtotalPaise !== undefined ? res.subtotalPaise / 100 : (res.subtotal || 0)),
      deliveryFee: (res.deliveryFeePaise !== undefined ? res.deliveryFeePaise / 100 : (res.deliveryFee || 0)),
      packagingFee: 0,
      discountAmount: 0,
      taxes: 0,
      total: (res.totalPaise !== undefined ? res.totalPaise / 100 : (res.total || 0)),
      deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliverySlot: 'Morning 5:30 AM – 7:00 AM',
      estimatedDeliveryWindow: 'Tomorrow before 7:00 AM',
      stockAvailable: true,
    };
  },

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    if (env.USE_MOCK_API) {
      return mockHandlers.createOrder(payload);
    }
    const reqBody = {
      items: payload.items.map((it) => ({
        productId: it.productId,
        variantId: it.variantId,
        quantity: it.quantity,
      })),
      addressId: payload.deliveryAddressId,
      deliveryAddressId: payload.deliveryAddressId,
      deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliverySlot: 'Morning 5:30 AM – 7:00 AM',
      paymentMethod: payload.paymentMethod,
      deliveryInstructions: payload.deliveryInstructions,
    };
    const res = await apiClient.post<any>('/orders', reqBody);
    return mapOrder(res);
  },
};
