import {
  MOCK_USER,
  MOCK_ADDRESSES,
  MOCK_PRODUCTS,
  MOCK_SUBSCRIPTIONS,
  MOCK_ORDERS,
  MOCK_PAYMENTS,
  MOCK_INVOICES,
} from './mock-data';
import { User, LoginCredentials, RegisterPayload } from '@/types/auth';
import { Address, CreateAddressPayload, UpdateAddressPayload } from '@/types/addresses';
import {
  Subscription,
  SubscriptionQuoteRequest,
  SubscriptionQuoteResponse,
  CreateSubscriptionPayload,
  SubscriptionChangeRequest,
  SubscriptionChangeResult,
  SubscriptionPauseRequest,
} from '@/types/subscriptions';
import {
  Order,
  OrderQuoteRequest,
  OrderQuoteResponse,
  CreateOrderPayload,
} from '@/types/orders';
import { PaymentTransaction, Invoice, WalletRechargePayload } from '@/types/payments';

// Mutable in-memory store for mock mode session
let currentUser: User | null = { ...MOCK_USER };
let addresses: Address[] = [...MOCK_ADDRESSES];
let products = [...MOCK_PRODUCTS];
let subscriptions: Subscription[] = [...MOCK_SUBSCRIPTIONS];
let orders: Order[] = [...MOCK_ORDERS];
let payments: PaymentTransaction[] = [...MOCK_PAYMENTS];
let invoices: Invoice[] = [...MOCK_INVOICES];

function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockHandlers = {
  // --- AUTH ---
  async getCurrentUser(): Promise<User | null> {
    await delay(200);
    return currentUser;
  },

  async login(creds: LoginCredentials): Promise<{ user: User; token: string }> {
    await delay(400);
    if (!creds.phoneOrEmail) {
      throw new Error('Please provide phone number or email address.');
    }
    currentUser = {
      ...MOCK_USER,
      phone: creds.phoneOrEmail.includes('@') ? MOCK_USER.phone : creds.phoneOrEmail.replace(/\D/g, ''),
      email: creds.phoneOrEmail.includes('@') ? creds.phoneOrEmail : MOCK_USER.email,
    };
    return { user: currentUser, token: 'mock-jwt-token-active' };
  },

  async register(payload: RegisterPayload): Promise<{ user: User; token: string }> {
    await delay(450);
    if (!payload.name || !payload.phone) {
      throw new Error('Name and mobile number are required.');
    }
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone.replace(/\D/g, ''),
      walletBalance: 100, // Welcome ₹100 credit
      isSubscribed: false,
      createdAt: new Date().toISOString(),
    };
    currentUser = newUser;
    return { user: newUser, token: 'mock-jwt-token-new' };
  },

  async logout(): Promise<{ success: boolean }> {
    await delay(200);
    currentUser = null;
    return { success: true };
  },

  // --- PRODUCTS ---
  async getProducts(category?: string, search?: string) {
    await delay(250);
    let list = [...products];
    if (category && category !== 'all') {
      list = list.filter((p) => p.category === category);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return list;
  },

  async getProductBySlug(slug: string) {
    await delay(200);
    const prod = products.find((p) => p.slug === slug);
    if (!prod) {
      throw new Error(`Product with slug '${slug}' not found.`);
    }
    return prod;
  },

  // --- ADDRESSES ---
  async getAddresses(): Promise<Address[]> {
    await delay(200);
    return [...addresses];
  },

  async createAddress(payload: CreateAddressPayload): Promise<Address> {
    await delay(350);
    if (!payload.flatNumber || !payload.buildingName || !payload.pincode) {
      throw new Error('Please fill in complete address details including flat number and pincode.');
    }
    const newAddr: Address = {
      ...payload,
      id: `addr_${Date.now()}`,
      userId: currentUser?.id || 'usr_ksheeraam_001',
    };
    if (payload.isDefault || addresses.length === 0) {
      addresses = addresses.map((a) => ({ ...a, isDefault: false }));
      newAddr.isDefault = true;
    }
    addresses.push(newAddr);
    return newAddr;
  },

  async updateAddress(id: string, payload: UpdateAddressPayload): Promise<Address> {
    await delay(300);
    const index = addresses.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Address not found');
    
    if (payload.isDefault) {
      addresses = addresses.map((a) => ({ ...a, isDefault: false }));
    }
    addresses[index] = { ...addresses[index], ...payload };
    return addresses[index];
  },

  async deleteAddress(id: string): Promise<{ success: boolean }> {
    await delay(250);
    addresses = addresses.filter((a) => a.id !== id);
    return { success: true };
  },

  // --- SUBSCRIPTIONS ---
  async getSubscriptions(): Promise<Subscription[]> {
    await delay(300);
    return [...subscriptions];
  },

  async getSubscriptionById(id: string): Promise<Subscription> {
    await delay(250);
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) throw new Error('Subscription not found');
    return sub;
  },

  async quoteSubscription(req: SubscriptionQuoteRequest): Promise<SubscriptionQuoteResponse> {
    await delay(350);
    // Real calculation on server side:
    // Determine number of deliveries in 30 days
    let deliveryDaysInMonth = 30;
    if (req.frequency === 'alternate') deliveryDaysInMonth = 15;
    if (req.frequency === 'custom' && req.customDays) {
      // 4.3 weeks in a month
      deliveryDaysInMonth = Math.round(req.customDays.length * 4.3);
    }

    let perDelivery = 0;
    let bottleDeposit = 0;

    for (const it of req.items) {
      const prod = products.find((p) => p.id === it.productId);
      const variant = prod?.variants.find((v) => v.id === it.variantId);
      const price = variant ? variant.price : 70;
      perDelivery += price * it.quantity;
      if (variant?.packagingType === 'glass_bottle') {
        bottleDeposit += 100 * it.quantity; // Refundable glass bottle deposit
      }
    }

    const monthlyTotal = perDelivery * deliveryDaysInMonth;
    const discount = deliveryDaysInMonth >= 30 ? Math.round(monthlyTotal * 0.05) : 0; // 5% monthly discount
    const totalPayableNow = monthlyTotal - discount + bottleDeposit;

    return {
      perDeliveryTotal: perDelivery,
      estimatedDeliveriesPerMonth: deliveryDaysInMonth,
      monthlyTotal,
      bottleDeposit,
      discountAmount: discount,
      taxAmount: 0,
      totalPayableNow,
      currency: 'INR',
      validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      canDeliverToPincode: true,
      pincodeDeliveryMessage: 'Daily morning delivery slot available between 5:30 AM and 7:00 AM.',
    };
  },

  async createSubscription(payload: CreateSubscriptionPayload): Promise<Subscription> {
    await delay(500);
    const addr = addresses.find((a) => a.id === payload.deliveryAddressId) || addresses[0];
    const items = payload.items.map((it) => {
      const p = products.find((prod) => prod.id === it.productId);
      const v = p?.variants.find((vr) => vr.id === it.variantId);
      return {
        productId: it.productId,
        productName: p?.name || 'Farm Fresh Milk',
        variantId: it.variantId,
        size: v?.size || '1L',
        quantity: it.quantity,
        unitPrice: v?.price || 72,
      };
    });

    const newSub: Subscription = {
      id: `sub_${Date.now()}`,
      userId: currentUser?.id || 'usr_ksheeraam_001',
      status: 'active',
      frequency: payload.frequency,
      customDays: payload.customDays,
      items,
      deliveryAddressId: addr.id,
      deliveryAddress: addr,
      startDate: payload.startDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      nextDeliveryDate: payload.startDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      autoRenew: true,
      paymentMethod: payload.paymentMethod,
      monthlyEstimate: items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) * 30,
      cutoffTime: '8:00 PM for next morning 7:00 AM delivery',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    subscriptions.unshift(newSub);
    return newSub;
  },

  async modifySubscription(id: string, req: SubscriptionChangeRequest): Promise<SubscriptionChangeResult> {
    await delay(400);
    const index = subscriptions.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Subscription not found');

    const sub = subscriptions[index];
    const updated = { ...sub };

    if (req.requestedQuantity !== undefined && updated.items[0]) {
      updated.items[0] = { ...updated.items[0], quantity: req.requestedQuantity };
      updated.monthlyEstimate = updated.items[0].unitPrice * req.requestedQuantity * 30;
    }

    if (req.requestedFrequency) {
      updated.frequency = req.requestedFrequency;
    }
    if (req.requestedCustomDays) {
      updated.customDays = req.requestedCustomDays;
    }

    updated.updatedAt = new Date().toISOString();
    subscriptions[index] = updated;

    // Server business logic: Check if modification is before 8:00 PM cutoff today
    const nowHour = new Date().getHours();
    const affectsTomorrow = nowHour < 20;

    return {
      success: true,
      effectiveFrom: req.effectiveDate,
      affectsNextDelivery: affectsTomorrow,
      message: affectsTomorrow
        ? `Changes confirmed and will take effect for tomorrow morning's delivery.`
        : `Changes confirmed for ${req.effectiveDate}. Since today's 8:00 PM dispatch cutoff has passed, tomorrow's delivery is already dispatched.`,
      updatedSubscription: updated,
    };
  },

  async pauseSubscription(id: string, req: SubscriptionPauseRequest): Promise<Subscription> {
    await delay(400);
    const index = subscriptions.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Subscription not found');

    subscriptions[index] = {
      ...subscriptions[index],
      status: 'paused',
      pauseStartDate: req.pauseStartDate,
      pauseEndDate: req.resumeDate,
      nextDeliveryDate: req.resumeDate,
      updatedAt: new Date().toISOString(),
    };
    return subscriptions[index];
  },

  async resumeSubscription(id: string): Promise<Subscription> {
    await delay(350);
    const index = subscriptions.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Subscription not found');

    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    subscriptions[index] = {
      ...subscriptions[index],
      status: 'active',
      pauseStartDate: undefined,
      pauseEndDate: undefined,
      nextDeliveryDate: tomorrow,
      updatedAt: new Date().toISOString(),
    };
    return subscriptions[index];
  },

  async cancelSubscription(id: string): Promise<Subscription> {
    await delay(450);
    const index = subscriptions.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Subscription not found');

    subscriptions[index] = {
      ...subscriptions[index],
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };
    return subscriptions[index];
  },

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    await delay(300);
    return [...orders];
  },

  async getOrderById(id: string): Promise<Order> {
    await delay(250);
    const ord = orders.find((o) => o.id === id);
    if (!ord) throw new Error('Order not found');
    return ord;
  },

  async quoteOrder(req: OrderQuoteRequest): Promise<OrderQuoteResponse> {
    await delay(350);
    let subtotal = 0;
    for (const it of req.items) {
      const p = products.find((prod) => prod.id === it.productId);
      const v = p?.variants.find((vr) => vr.id === it.variantId);
      subtotal += (v?.price || 70) * it.quantity;
    }

    const deliveryFee = subtotal >= 200 ? 0 : 30;
    const packagingFee = 15;
    let discount = 0;
    if (req.couponCode?.toUpperCase() === 'PUREMILK') {
      discount = 40;
    }

    const tomorrow = new Date(Date.now() + 86400000);
    const dateFormatted = tomorrow.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    return {
      subtotal,
      deliveryFee,
      packagingFee,
      discountAmount: discount,
      taxes: 0,
      total: subtotal + deliveryFee + packagingFee - discount,
      deliveryDate: tomorrow.toISOString().split('T')[0],
      deliverySlot: '5:30 AM - 7:00 AM Morning Drop',
      estimatedDeliveryWindow: `${dateFormatted} before 7:00 AM`,
      stockAvailable: true,
    };
  },

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    await delay(600);
    const addr = addresses.find((a) => a.id === payload.deliveryAddressId) || addresses[0];
    let subtotal = 0;
    const items = payload.items.map((it) => {
      const p = products.find((prod) => prod.id === it.productId);
      const v = p?.variants.find((vr) => vr.id === it.variantId);
      const price = v?.price || 72;
      const itemSub = price * it.quantity;
      subtotal += itemSub;
      return {
        productId: it.productId,
        productName: p?.name || 'Dairy Product',
        variantId: it.variantId,
        size: v?.size || '1L',
        quantity: it.quantity,
        unitPrice: price,
        subtotal: itemSub,
      };
    });

    const deliveryFee = subtotal >= 200 ? 0 : 30;
    const packagingFee = 15;
    const total = subtotal + deliveryFee + packagingFee;
    const orderNum = `KSH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber: orderNum,
      userId: currentUser?.id || 'usr_ksheeraam_001',
      orderType: 'one_time',
      status: 'confirmed',
      paymentStatus: payload.paymentMethod === 'cod' ? 'pending' : 'paid',
      paymentMethod: payload.paymentMethod,
      items,
      address: addr,
      deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliverySlot: '5:30 AM - 7:00 AM Morning Drop',
      subtotal,
      deliveryFee,
      packagingFee,
      discount: 0,
      taxes: 0,
      total,
      timeline: [
        {
          status: 'placed',
          title: 'Order Placed',
          description: `Order received via ${payload.paymentMethod.toUpperCase()}`,
          timestamp: new Date().toISOString(),
          isCompleted: true,
          isCurrent: false,
        },
        {
          status: 'confirmed',
          title: 'Confirmed by Fulfillment Center',
          description: 'Allocated fresh milk stock for early morning distribution.',
          timestamp: new Date().toISOString(),
          isCompleted: true,
          isCurrent: true,
        },
        {
          status: 'packed',
          title: 'Packing at Cold-Chain Hub',
          description: 'Scheduled for bottle sterilization and sealing tonight.',
          timestamp: undefined,
          isCompleted: false,
          isCurrent: false,
        },
        {
          status: 'out_for_delivery',
          title: 'Out for Morning Delivery',
          description: 'Rider will deliver before 7:00 AM.',
          timestamp: undefined,
          isCompleted: false,
          isCurrent: false,
        },
        {
          status: 'delivered',
          title: 'Delivered',
          description: 'Delivered at doorstep.',
          timestamp: undefined,
          isCompleted: false,
          isCurrent: false,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.unshift(newOrder);

    // Also record transaction
    if (payload.paymentMethod !== 'cod') {
      const newPay: PaymentTransaction = {
        id: `pay_${Date.now()}`,
        transactionNumber: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        amount: total,
        currency: 'INR',
        status: 'paid',
        method: payload.paymentMethod.toUpperCase(),
        gateway: 'phonepe',
        description: `Payment for Order #${orderNum}`,
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
      };
      payments.unshift(newPay);
    }

    return newOrder;
  },

  // --- PAYMENTS & INVOICES ---
  async getPayments(): Promise<PaymentTransaction[]> {
    await delay(250);
    return [...payments];
  },

  async getInvoices(): Promise<Invoice[]> {
    await delay(250);
    return [...invoices];
  },

  async getInvoiceById(id: string): Promise<Invoice> {
    await delay(200);
    const inv = invoices.find((i) => i.id === id || i.invoiceNumber === id || i.orderId === id);
    if (!inv) throw new Error('Invoice not found');
    return inv;
  },

  async rechargeWallet(payload: WalletRechargePayload): Promise<{ user: User; transaction: PaymentTransaction }> {
    await delay(500);
    if (!currentUser) throw new Error('Not logged in');
    if (payload.amount < 100) throw new Error('Minimum wallet recharge is ₹100.');

    currentUser = {
      ...currentUser,
      walletBalance: currentUser.walletBalance + payload.amount,
    };

    const txn: PaymentTransaction = {
      id: `pay_${Date.now()}`,
      transactionNumber: `TXN-WLT-${Date.now()}`,
      amount: payload.amount,
      currency: 'INR',
      status: 'paid',
      method: 'Instant UPI Recharge',
      gateway: 'phonepe',
      description: `Wallet top-up (+₹${payload.amount})`,
      invoiceNumber: `INV-WLT-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };
    payments.unshift(txn);

    return { user: currentUser, transaction: txn };
  },
};
