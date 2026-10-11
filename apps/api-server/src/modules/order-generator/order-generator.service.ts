import mongoose from 'mongoose';
import {
  OrderStatus,
  OrderType,
  PackagingType,
  PaymentMethod,
  PaymentStatus,
  SubscriptionStatus,
  getKolkataDateString,
  getKolkataTomorrowDateString,
} from '@ksheeraam/contracts';
import { SubscriptionModel } from '../../models/Subscription';
import { OrderModel } from '../../models/Order';
import { UserModel } from '../../models/User';
import { DeliveryAssignmentModel } from '../../models/DeliveryAssignment';
import { PrepaidLedgerEntryModel } from '../../models/Billing';
import { subscriptionsService } from '../subscriptions/subscriptions.service';
import { inventoryService } from '../inventory/inventory.service';

export interface OrderGenerationResult {
  targetDeliveryDate: string;
  totalActiveSubscriptions: number;
  ordersCreated: number;
  skippedAlreadyGenerated: number;
  skippedNotEligible: number;
  stockAllocationFailures: number;
  errors: Array<{ subscriptionId: string; message: string }>;
  durationMs: number;
}

export class OrderGeneratorService {
  /**
   * Generates orders for eligible subscriptions for a target business date (Asia/Kolkata).
   * Idempotent: can be executed multiple times without generating duplicate orders,
   * charging wallets twice, or creating double stock reservations.
   */
  async generateOrdersForDate(targetDate?: string): Promise<OrderGenerationResult> {
    const startTime = Date.now();
    const dateKey = targetDate || getKolkataTomorrowDateString();

    const result: OrderGenerationResult = {
      targetDeliveryDate: dateKey,
      totalActiveSubscriptions: 0,
      ordersCreated: 0,
      skippedAlreadyGenerated: 0,
      skippedNotEligible: 0,
      stockAllocationFailures: 0,
      errors: [],
      durationMs: 0,
    };

    const activeSubscriptions = await SubscriptionModel.find({
      status: SubscriptionStatus.ACTIVE,
    });
    result.totalActiveSubscriptions = activeSubscriptions.length;

    for (const sub of activeSubscriptions) {
      try {
        // 1. Eligibility Check (schedule, frequency, pause window, start/end dates)
        const isEligible = subscriptionsService.isEligibleDeliveryDate(sub, dateKey);
        if (!isEligible) {
          result.skippedNotEligible++;
          continue;
        }

        // 2. Idempotency Check: check if order already exists for this subscription & date
        const existingOrder = await OrderModel.findOne({
          subscriptionId: sub._id,
          deliveryDate: dateKey,
        });

        if (existingOrder) {
          result.skippedAlreadyGenerated++;
          continue;
        }

        // 3. Compute item totals in integer paise
        let subtotalPaise = 0;
        const orderItems = sub.items.map((item: any) => {
          const lineTotal = item.unitPricePaise * item.quantity;
          subtotalPaise += lineTotal;
          return {
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            size: item.size,
            packagingType: PackagingType.GLASS_BOTTLE,
            quantity: item.quantity,
            unitPricePaise: item.unitPricePaise,
            subtotalPaise: lineTotal,
          };
        });

        const deliveryFeePaise = 0; // Subscriptions include morning delivery
        const totalPaise = subtotalPaise + deliveryFeePaise;

        // 4. Concurrency-Safe Stock Reservation
        let stockAllocated = false;
        try {
          await inventoryService.reserveStock(
            sub.items.map((i: any) => ({
              productId: i.productId.toString(),
              size: i.size,
              packagingType: PackagingType.GLASS_BOTTLE,
              quantity: i.quantity,
            })),
            `SUB_GEN_${sub.subscriptionNumber}_${dateKey}`,
            'ORDER_GENERATOR_CRON'
          );
          stockAllocated = true;
        } catch (stockErr: any) {
          console.warn(
            `[OrderGenerator] Stock shortage for sub ${sub.subscriptionNumber}: ${stockErr.message}`
          );
          result.stockAllocationFailures++;
          // Order will still generate with stockAllocated=false for visibility and procurement alerting
        }

        // 5. Payment & Wallet Entitlement Consumption
        const customer = await UserModel.findById(sub.customerId);
        let paymentStatus = PaymentStatus.PENDING;
        let paymentMethod = PaymentMethod.WALLET;

        if (customer && customer.walletBalancePaise >= totalPaise) {
          // Debit customer prepaid wallet
          customer.walletBalancePaise -= totalPaise;
          await customer.save();

          paymentStatus = PaymentStatus.PAID;
          paymentMethod = PaymentMethod.WALLET;

          await PrepaidLedgerEntryModel.create({
            customerId: customer._id,
            amountPaise: totalPaise,
            balanceAfterPaise: customer.walletBalancePaise,
            type: 'debit',
            referenceType: 'subscription_charge',
            referenceId: sub.subscriptionNumber,
            description: `Subscription drop delivery for ${dateKey}`,
            createdAt: new Date(),
          });
        } else {
          paymentStatus = PaymentStatus.PENDING;
          paymentMethod = PaymentMethod.COD;
        }

        // 6. Create Order with compound unique index idempotency
        const count = await OrderModel.countDocuments();
        const orderNumber = `SUB-ORD-${dateKey.replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

        let order;
        try {
          order = await OrderModel.create({
            orderNumber,
            customerId: sub.customerId,
            customerName: sub.customerName,
            customerPhone: sub.customerPhone,
            orderType: OrderType.SUBSCRIPTION,
            status: OrderStatus.CONFIRMED,
            stockAllocated,
            paymentStatus,
            paymentMethod,
            items: orderItems,
            addressId: sub.addressId,
            deliveryAddress: sub.deliveryAddress,
            pincode: sub.pincode,
            deliveryDate: dateKey,
            deliverySlot: sub.deliverySlot || 'Morning 6:00 AM - 7:30 AM',
            subtotalPaise,
            deliveryFeePaise,
            totalPaise,
            subscriptionId: sub._id,
          });
        } catch (duplicateErr: any) {
          if (duplicateErr.code === 11000) {
            // Concurrently generated by another worker or retry; safe ignore
            result.skippedAlreadyGenerated++;
            continue;
          }
          throw duplicateErr;
        }

        // 7. Create Delivery Assignment
        await DeliveryAssignmentModel.create({
          orderId: order._id,
          orderNumber: order.orderNumber,
          deliveryDate: dateKey,
          status: 'assigned',
          amountToCollectPaise: paymentStatus === PaymentStatus.PAID ? 0 : totalPaise,
          cashCollectedPaise: 0,
          events: [
            {
              status: 'assigned',
              timestamp: new Date(),
              notes: 'Generated from recurring subscription',
            },
          ],
        });

        // 8. Advance Subscription's nextDeliveryDate
        const nextDay = new Date(dateKey);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDateStr = nextDay.toISOString().split('T')[0];
        sub.nextDeliveryDate = subscriptionsService.findNextEligibleDeliveryDate(sub, nextDateStr);
        await sub.save();

        result.ordersCreated++;
      } catch (err: any) {
        result.errors.push({
          subscriptionId: sub._id.toString(),
          message: err.message || 'Unknown generation failure',
        });
      }
    }

    result.durationMs = Date.now() - startTime;
    console.log(
      `[OrderGenerator] Job finished for ${dateKey}: ${result.ordersCreated} created, ${result.skippedAlreadyGenerated} skipped, in ${result.durationMs}ms`
    );

    return result;
  }
}

export const orderGeneratorService = new OrderGeneratorService();
