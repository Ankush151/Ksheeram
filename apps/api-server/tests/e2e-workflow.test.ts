import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import {
  DeliveryStatus,
  OrderStatus,
  PackageSize,
  PackagingType,
  PaymentMethod,
  PaymentStatus,
  Role,
  SubscriptionFrequency,
} from '@ksheeraam/contracts';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { UserModel } from '../src/models/User';
import { ProductModel } from '../src/models/Product';
import { AddressModel } from '../src/models/Address';
import { SubscriptionModel } from '../src/models/Subscription';
import { OrderModel } from '../src/models/Order';
import { DeliveryAssignmentModel } from '../src/models/DeliveryAssignment';
import { InventoryBalanceModel } from '../src/models/Inventory';
import { InvoiceModel, PaymentModel, PrepaidLedgerEntryModel } from '../src/models/Billing';
import { billingService } from '../src/modules/billing/billing.service';
import { subscriptionsService } from '../src/modules/subscriptions/subscriptions.service';
import { orderGeneratorService } from '../src/modules/order-generator/order-generator.service';
import { deliveryService } from '../src/modules/delivery/delivery.service';
import { reportsService } from '../src/modules/reports/reports.service';

describe('End-to-End Business Lifecycle: Subscription → Order Gen → Stock Allocation → Delivery → Billing', () => {
  let customerUser: any;
  let deliveryAgentUser: any;
  let product: any;
  let address: any;
  let subscription: any;
  const deliveryDateKey = '2026-12-01';

  beforeAll(async () => {
    await connectDatabase();

    // 1. Create Customer
    customerUser = await UserModel.create({
      name: 'Pooja Hegde',
      phone: `9777${Math.floor(100000 + Math.random() * 900000)}`,
      email: `pooja_${Date.now()}@example.com`,
      role: Role.CUSTOMER,
      walletBalancePaise: 0,
    });

    // 2. Create Delivery Agent
    deliveryAgentUser = await UserModel.create({
      name: 'Santosh Rider',
      phone: `9888${Math.floor(100000 + Math.random() * 900000)}`,
      role: Role.DELIVERY_AGENT,
      assignedRoute: 'Indiranagar Morning Route',
    });

    // 3. Create Product & Variant (₹88.00 = 8800 paise)
    product = await ProductModel.create({
      name: 'E2E Pure Desi Cow Milk',
      slug: `e2e-milk-${Date.now()}`,
      category: 'cow_milk',
      fatContent: '4.5%',
      snfContent: '8.5%',
      imageUrl: '/milk.png',
      variants: [
        {
          size: PackageSize.L_1,
          packagingType: PackagingType.GLASS_BOTTLE,
          pricePaise: 8800,
          mrpPaise: 9000,
          inStock: true,
          saleableUnits: 50,
        },
      ],
    });

    // 4. Initial Packaged-Unit Inventory
    await InventoryBalanceModel.create({
      productId: product._id,
      productName: product.name,
      size: PackageSize.L_1,
      packagingType: PackagingType.GLASS_BOTTLE,
      physicalUnits: 50,
      reservedUnits: 0,
      damagedUnits: 0,
      reorderLevel: 10,
    });

    // 5. Customer Delivery Address
    address = await AddressModel.create({
      userId: customerUser._id,
      label: 'Home',
      flatNumber: 'Villa 14',
      buildingName: 'Palm Meadows',
      streetArea: 'Airport Road',
      city: 'Bangalore',
      pincode: '560017',
      isDefault: true,
    });
  });

  afterAll(async () => {
    await UserModel.deleteMany({ _id: { $in: [customerUser._id, deliveryAgentUser._id] } });
    await ProductModel.findByIdAndDelete(product._id);
    await AddressModel.deleteMany({ userId: customerUser._id });
    await InventoryBalanceModel.deleteMany({ productId: product._id });
    if (subscription) await SubscriptionModel.findByIdAndDelete(subscription.id);
    await OrderModel.deleteMany({ customerId: customerUser._id });
    await DeliveryAssignmentModel.deleteMany({ deliveryDate: deliveryDateKey });
    await InvoiceModel.deleteMany({ customerId: customerUser._id });
    await PaymentModel.deleteMany({ customerId: customerUser._id });
    await PrepaidLedgerEntryModel.deleteMany({ customerId: customerUser._id });
    await disconnectDatabase();
  });

  it('Step 1: Customer recharges prepaid wallet with ₹1,000 (100,000 paise)', async () => {
    const rechargeResult = await billingService.topupWallet(
      customerUser._id.toString(),
      100000, // ₹1,000.00
      PaymentMethod.UPI
    );

    expect(rechargeResult.newBalancePaise).toBe(100000);

    const userInDb = await UserModel.findById(customerUser._id);
    expect(userInDb?.walletBalancePaise).toBe(100000);
  });

  it('Step 2: Customer creates recurring daily milk subscription', async () => {
    subscription = await subscriptionsService.createSubscription(customerUser._id.toString(), {
      frequency: SubscriptionFrequency.DAILY,
      items: [
        {
          productId: product._id.toString(),
          size: PackageSize.L_1,
          quantity: 1,
        },
      ],
      addressId: address._id.toString(),
      startDate: deliveryDateKey,
    });

    expect(subscription.id).toBeTruthy();
    expect(subscription.status).toBe('active');
    expect(subscription.items[0].unitPricePaise).toBe(8800);
  });

  it('Step 3: Scheduled order generator runs for target delivery date, allocating stock & debiting wallet', async () => {
    const result = await orderGeneratorService.generateOrdersForDate(deliveryDateKey);
    expect(result.ordersCreated).toBeGreaterThanOrEqual(1);

    // Verify order was created
    const order = await OrderModel.findOne({
      customerId: customerUser._id,
      deliveryDate: deliveryDateKey,
    });

    expect(order).toBeTruthy();
    expect(order?.status).toBe(OrderStatus.CONFIRMED);
    expect(order?.stockAllocated).toBe(true);
    expect(order?.paymentStatus).toBe(PaymentStatus.PAID);
    expect(order?.paymentMethod).toBe(PaymentMethod.WALLET);
    expect(order?.totalPaise).toBe(8800);

    // Verify customer wallet debited exactly 8800 paise
    const userInDb = await UserModel.findById(customerUser._id);
    expect(userInDb?.walletBalancePaise).toBe(100000 - 8800); // 91200 paise

    // Verify stock reserved = 1
    const inventory = await InventoryBalanceModel.findOne({ productId: product._id });
    expect(inventory?.reservedUnits).toBe(1);
    expect(inventory?.availableUnits).toBe(49);
  });

  it('Step 4: Retry of order generator is strictly idempotent', async () => {
    const userBefore = await UserModel.findById(customerUser._id);
    const balanceBefore = userBefore?.walletBalancePaise;

    const retryResult = await orderGeneratorService.generateOrdersForDate(deliveryDateKey);
    expect(retryResult.skippedAlreadyGenerated).toBeGreaterThanOrEqual(1);

    // Wallet balance untouched
    const userAfter = await UserModel.findById(customerUser._id);
    expect(userAfter?.walletBalancePaise).toBe(balanceBefore);

    // Only 1 order exists for this date
    const ordersCount = await OrderModel.countDocuments({
      customerId: customerUser._id,
      deliveryDate: deliveryDateKey,
    });
    expect(ordersCount).toBe(1);
  });

  it('Step 5: Admin assigns delivery agent to manifest stop', async () => {
    const order = await OrderModel.findOne({ customerId: customerUser._id, deliveryDate: deliveryDateKey });

    const assignResult = await deliveryService.assignAgent({
      orderIds: [order!._id.toString()],
      agentId: deliveryAgentUser._id.toString(),
    });

    expect(assignResult.updatedCount).toBe(1);

    const assignment = await DeliveryAssignmentModel.findOne({ orderId: order!._id });
    expect(assignment?.assignedAgentId?.toString()).toBe(deliveryAgentUser._id.toString());
  });

  it('Step 6: Delivery agent completes doorstep drop, fulfilling stock reservation into morning dispatch', async () => {
    const order = await OrderModel.findOne({ customerId: customerUser._id, deliveryDate: deliveryDateKey });

    const completion = await deliveryService.completeDelivery(
      {
        orderId: order!._id.toString(),
        cashCollectedPaise: 0, // Prepaid order
        agentNotes: 'Placed inside insulated door drop bag',
      },
      deliveryAgentUser._id.toString(),
      Role.DELIVERY_AGENT
    );

    expect(completion.status).toBe(DeliveryStatus.DELIVERED);

    // Verify Order status is DELIVERED
    const orderAfter = await OrderModel.findById(order!._id);
    expect(orderAfter?.status).toBe(OrderStatus.DELIVERED);

    // Verify stock reservation fulfilled: physicalUnits: 50 - 1 = 49, reservedUnits: 0
    const inventory = await InventoryBalanceModel.findOne({ productId: product._id });
    expect(inventory?.physicalUnits).toBe(49);
    expect(inventory?.reservedUnits).toBe(0);
    expect(inventory?.availableUnits).toBe(49);
  });

  it('Step 7: Admin generates tax invoice and reviews billing reconciliation', async () => {
    const order = await OrderModel.findOne({ customerId: customerUser._id, deliveryDate: deliveryDateKey });

    const invoice = await billingService.createInvoiceForOrder(order!._id.toString());
    expect(invoice.invoiceNumber).toBeTruthy();
    expect(invoice.totalPaise).toBe(8800);
    expect(invoice.status).toBe('paid');

    // Daily reporting aggregates clean metrics
    const report = await reportsService.getDailyReport(deliveryDateKey);
    expect(report.deliveredUnits).toBeGreaterThanOrEqual(1);
    expect(report.grossRevenuePaise).toBeGreaterThanOrEqual(8800);
  });
});
