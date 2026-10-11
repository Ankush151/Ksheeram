import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { PackageSize, PackagingType } from '@ksheeraam/contracts';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { InventoryBalanceModel, InventoryMovementModel } from '../src/models/Inventory';
import { ProductModel } from '../src/models/Product';
import { inventoryService } from '../src/modules/inventory/inventory.service';
import { AppError } from '../src/utils/errors';

describe('Inventory & Concurrency-Safe Stock Reservations', () => {
  let testProductId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await connectDatabase();

    const product = await ProductModel.create({
      name: 'Test Milk Product',
      slug: `test-milk-${Date.now()}`,
      category: 'cow_milk',
      fatContent: '4.0%',
      snfContent: '8.5%',
      imageUrl: '/test.png',
      variants: [
        {
          size: PackageSize.L_1,
          packagingType: PackagingType.GLASS_BOTTLE,
          pricePaise: 7000,
          mrpPaise: 7500,
          inStock: true,
          saleableUnits: 100,
        },
      ],
    });
    testProductId = product._id as mongoose.Types.ObjectId;
  });

  afterAll(async () => {
    await ProductModel.findByIdAndDelete(testProductId);
    await InventoryBalanceModel.deleteMany({ productId: testProductId });
    await InventoryMovementModel.deleteMany({ productId: testProductId });
    await disconnectDatabase();
  });

  it('correctly calculates available units = physicalUnits - reservedUnits', async () => {
    const balance = await inventoryService.getOrCreateBalance(
      testProductId.toString(),
      PackageSize.L_1,
      PackagingType.GLASS_BOTTLE
    );

    balance.physicalUnits = 50;
    balance.reservedUnits = 10;
    await balance.save();

    const fetched = await InventoryBalanceModel.findById(balance._id);
    expect(fetched?.availableUnits).toBe(40);
  });

  it('atomically reserves stock and increments reservedUnits', async () => {
    const balance = await inventoryService.getOrCreateBalance(
      testProductId.toString(),
      PackageSize.L_1,
      PackagingType.GLASS_BOTTLE
    );
    balance.physicalUnits = 30;
    balance.reservedUnits = 0;
    await balance.save();

    await inventoryService.reserveStock(
      [
        {
          productId: testProductId.toString(),
          size: PackageSize.L_1,
          packagingType: PackagingType.GLASS_BOTTLE,
          quantity: 15,
        },
      ],
      'TEST_ORDER_001',
      'TESTER'
    );

    const updated = await InventoryBalanceModel.findById(balance._id);
    expect(updated?.reservedUnits).toBe(15);
    expect(updated?.availableUnits).toBe(15);
  });

  it('rejects reservation and rolls back when stock is insufficient', async () => {
    const balance = await inventoryService.getOrCreateBalance(
      testProductId.toString(),
      PackageSize.L_1,
      PackagingType.GLASS_BOTTLE
    );
    balance.physicalUnits = 10;
    balance.reservedUnits = 8; // Available = 2
    await balance.save();

    await expect(
      inventoryService.reserveStock(
        [
          {
            productId: testProductId.toString(),
            size: PackageSize.L_1,
            packagingType: PackagingType.GLASS_BOTTLE,
            quantity: 5, // Requires 5, only 2 available
          },
        ],
        'TEST_ORDER_EXCEED',
        'TESTER'
      )
    ).rejects.toThrow(AppError);

    // reservedUnits must still be 8 (no partial or corrupted leak)
    const after = await InventoryBalanceModel.findById(balance._id);
    expect(after?.reservedUnits).toBe(8);
  });

  it('releases reserved units back to available when an order is cancelled', async () => {
    const balance = await inventoryService.getOrCreateBalance(
      testProductId.toString(),
      PackageSize.L_1,
      PackagingType.GLASS_BOTTLE
    );
    balance.physicalUnits = 20;
    balance.reservedUnits = 10;
    await balance.save();

    await inventoryService.releaseReservation(
      [
        {
          productId: testProductId.toString(),
          size: PackageSize.L_1,
          packagingType: PackagingType.GLASS_BOTTLE,
          quantity: 5,
        },
      ],
      'TEST_CANCEL_001',
      'Customer cancelled'
    );

    const updated = await InventoryBalanceModel.findById(balance._id);
    expect(updated?.reservedUnits).toBe(5);
    expect(updated?.availableUnits).toBe(15);
  });

  it('fulfills reserved stock by decrementing physical and reserved units on morning dispatch', async () => {
    const balance = await inventoryService.getOrCreateBalance(
      testProductId.toString(),
      PackageSize.L_1,
      PackagingType.GLASS_BOTTLE
    );
    balance.physicalUnits = 20;
    balance.reservedUnits = 5;
    await balance.save();

    await inventoryService.fulfillReservation(
      [
        {
          productId: testProductId.toString(),
          size: PackageSize.L_1,
          packagingType: PackagingType.GLASS_BOTTLE,
          quantity: 5,
        },
      ],
      'TEST_DISPATCH_001'
    );

    const updated = await InventoryBalanceModel.findById(balance._id);
    expect(updated?.physicalUnits).toBe(15);
    expect(updated?.reservedUnits).toBe(0);
    expect(updated?.availableUnits).toBe(15);
  });
});
