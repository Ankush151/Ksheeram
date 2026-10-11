import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import {
  PackageSize,
  PackagingType,
  Role,
  SubscriptionFrequency,
  SubscriptionStatus,
} from '@ksheeraam/contracts';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { UserModel } from '../src/models/User';
import { ProductModel } from '../src/models/Product';
import { AddressModel } from '../src/models/Address';
import { SubscriptionModel } from '../src/models/Subscription';
import { OrderModel } from '../src/models/Order';
import { DeliveryAssignmentModel } from '../src/models/DeliveryAssignment';
import { InventoryBalanceModel } from '../src/models/Inventory';
import { PrepaidLedgerEntryModel } from '../src/models/Billing';
import { orderGeneratorService } from '../src/modules/order-generator/order-generator.service';

describe('Scheduled Order Generation & Idempotency Controls', () => {
  let customerId: mongoose.Types.ObjectId;
  let subscriptionId: mongoose.Types.ObjectId;
  let productId: mongoose.Types.ObjectId;
  const targetDate = '2026-11-20';

  beforeAll(async () => {
    await connectDatabase();

    // Create Customer with sufficient wallet balance (₹500.00 = 50000 paise)
    const customer = await UserModel.create({
      name: 'Idempotency Tester',
      phone: `9999${Math.floor(100000 + Math.random() * 900000)}`,
      email: `idempotency_${Date.now()}@test.com`,
      role: Role.CUSTOMER,
      walletBalancePaise: 50000,
    });
    customerId = customer._id as mongoose.Types.ObjectId;

    // Create Address
    const address = await AddressModel.create({
      userId: customerId,
      flatNumber: 'B-102',
      buildingName: 'Tower 4',
      streetArea: 'Koramangala 4th Block',
      city: 'Bangalore',
      pincode: '560034',
      isDefault: true,
    });

    // Create Product
    const product = await ProductModel.create({
      name: 'Idempotency Cow Milk',
      slug: `idempotency-milk-${Date.now()}`,
      category: 'cow_milk',
      fatContent: '4.0%',
      snfContent: '8.5%',
      imageUrl: '/img.png',
      variants: [
        {
          size: PackageSize.L_1,
          packagingType: PackagingType.GLASS_BOTTLE,
          pricePaise: 7500, // ₹75.00
          mrpPaise: 8000,
          inStock: true,
          saleableUnits: 100,
        },
      ],
    });
    productId = product._id as mongoose.Types.ObjectId;

    // Setup inventory with 100 physical units
    await InventoryBalanceModel.create({
      productId,
      productName: product.name,
      size: PackageSize.L_1,
      packagingType: PackagingType.GLASS_BOTTLE,
      physicalUnits: 100,
      reservedUnits: 0,
      damagedUnits: 0,
      reorderLevel: 10,
    });

    // Create Active Daily Subscription
    const sub = await SubscriptionModel.create({
      subscriptionNumber: `SUB-TEST-${Date.now()}`,
      customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      status: SubscriptionStatus.ACTIVE,
      frequency: SubscriptionFrequency.DAILY,
      items: [
        {
          productId,
          variantId: product.variants[0]._id,
          productName: product.name,
          size: PackageSize.L_1,
          quantity: 1,
          unitPricePaise: 7500,
        },
      ],
      addressId: address._id,
      deliveryAddress: 'B-102, Tower 4, Koramangala, Bangalore - 560034',
      pincode: '560034',
      startDate: '2026-11-01',
      nextDeliveryDate: targetDate,
    });
    subscriptionId = sub._id as mongoose.Types.ObjectId;
  });

  afterAll(async () => {
    await UserModel.findByIdAndDelete(customerId);
    await AddressModel.deleteMany({ userId: customerId });
    await ProductModel.findByIdAndDelete(productId);
    await InventoryBalanceModel.deleteMany({ productId });
    await SubscriptionModel.findByIdAndDelete(subscriptionId);
    await OrderModel.deleteMany({ subscriptionId });
    await DeliveryAssignmentModel.deleteMany({ deliveryDate: targetDate });
    await PrepaidLedgerEntryModel.deleteMany({ customerId });
    await disconnectDatabase();
  });

  it('first run: successfully generates order, consumes wallet balance, and reserves stock', async () => {
    const result = await orderGeneratorService.generateOrdersForDate(targetDate);

    expect(result.ordersCreated).toBeGreaterThanOrEqual(1);

    // Verify exactly one order exists in database for this subscription on target date
    const orders = await OrderModel.find({ subscriptionId, deliveryDate: targetDate });
    expect(orders.length).toBe(1);

    const order = orders[0];
    expect(order.totalPaise).toBe(7500);
    expect(order.paymentStatus).toBe('paid');
    expect(order.paymentMethod).toBe('wallet');
    expect(order.stockAllocated).toBe(true);

    // Verify wallet was debited once
    const customer = await UserModel.findById(customerId);
    expect(customer?.walletBalancePaise).toBe(50000 - 7500); // 42500 paise
  });

  it('second run (immediate retry): is completely idempotent, creating 0 duplicate orders and 0 extra charges', async () => {
    const customerBefore = await UserModel.findById(customerId);
    const balanceBefore = customerBefore?.walletBalancePaise;

    const inventoryBefore = await InventoryBalanceModel.findOne({ productId });
    const reservedUnitsBefore = inventoryBefore?.reservedUnits;

    // Run order generator again for the exact same target date
    const retryResult = await orderGeneratorService.generateOrdersForDate(targetDate);

    // Must report as skipped already generated!
    expect(retryResult.skippedAlreadyGenerated).toBeGreaterThanOrEqual(1);

    // Orders count must strictly remain 1
    const ordersAfter = await OrderModel.find({ subscriptionId, deliveryDate: targetDate });
    expect(ordersAfter.length).toBe(1);

    // Wallet balance must not be charged twice!
    const customerAfter = await UserModel.findById(customerId);
    expect(customerAfter?.walletBalancePaise).toBe(balanceBefore);

    // Inventory reserved units must not be double-reserved!
    const inventoryAfter = await InventoryBalanceModel.findOne({ productId });
    expect(inventoryAfter?.reservedUnits).toBe(reservedUnitsBefore);
  });
});
