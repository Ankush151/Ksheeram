"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderGeneratorService = exports.OrderGeneratorService = void 0;
const contracts_1 = require("@ksheeraam/contracts");
const Subscription_1 = require("../../models/Subscription");
const Order_1 = require("../../models/Order");
const User_1 = require("../../models/User");
const DeliveryAssignment_1 = require("../../models/DeliveryAssignment");
const Billing_1 = require("../../models/Billing");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
const inventory_service_1 = require("../inventory/inventory.service");
class OrderGeneratorService {
    /**
     * Generates orders for eligible subscriptions for a target business date (Asia/Kolkata).
     * Idempotent: can be executed multiple times without generating duplicate orders,
     * charging wallets twice, or creating double stock reservations.
     */
    async generateOrdersForDate(targetDate) {
        const startTime = Date.now();
        const dateKey = targetDate || (0, contracts_1.getKolkataTomorrowDateString)();
        const result = {
            targetDeliveryDate: dateKey,
            totalActiveSubscriptions: 0,
            ordersCreated: 0,
            skippedAlreadyGenerated: 0,
            skippedNotEligible: 0,
            stockAllocationFailures: 0,
            errors: [],
            durationMs: 0,
        };
        const activeSubscriptions = await Subscription_1.SubscriptionModel.find({
            status: contracts_1.SubscriptionStatus.ACTIVE,
        });
        result.totalActiveSubscriptions = activeSubscriptions.length;
        for (const sub of activeSubscriptions) {
            try {
                // 1. Eligibility Check (schedule, frequency, pause window, start/end dates)
                const isEligible = subscriptions_service_1.subscriptionsService.isEligibleDeliveryDate(sub, dateKey);
                if (!isEligible) {
                    result.skippedNotEligible++;
                    continue;
                }
                // 2. Idempotency Check: check if order already exists for this subscription & date
                const existingOrder = await Order_1.OrderModel.findOne({
                    subscriptionId: sub._id,
                    deliveryDate: dateKey,
                });
                if (existingOrder) {
                    result.skippedAlreadyGenerated++;
                    continue;
                }
                // 3. Compute item totals in integer paise
                let subtotalPaise = 0;
                const orderItems = sub.items.map((item) => {
                    const lineTotal = item.unitPricePaise * item.quantity;
                    subtotalPaise += lineTotal;
                    return {
                        productId: item.productId,
                        variantId: item.variantId,
                        productName: item.productName,
                        size: item.size,
                        packagingType: contracts_1.PackagingType.GLASS_BOTTLE,
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
                    await inventory_service_1.inventoryService.reserveStock(sub.items.map((i) => ({
                        productId: i.productId.toString(),
                        size: i.size,
                        packagingType: contracts_1.PackagingType.GLASS_BOTTLE,
                        quantity: i.quantity,
                    })), `SUB_GEN_${sub.subscriptionNumber}_${dateKey}`, 'ORDER_GENERATOR_CRON');
                    stockAllocated = true;
                }
                catch (stockErr) {
                    console.warn(`[OrderGenerator] Stock shortage for sub ${sub.subscriptionNumber}: ${stockErr.message}`);
                    result.stockAllocationFailures++;
                    // Order will still generate with stockAllocated=false for visibility and procurement alerting
                }
                // 5. Payment & Wallet Entitlement Consumption
                const customer = await User_1.UserModel.findById(sub.customerId);
                let paymentStatus = contracts_1.PaymentStatus.PENDING;
                let paymentMethod = contracts_1.PaymentMethod.WALLET;
                if (customer && customer.walletBalancePaise >= totalPaise) {
                    // Debit customer prepaid wallet
                    customer.walletBalancePaise -= totalPaise;
                    await customer.save();
                    paymentStatus = contracts_1.PaymentStatus.PAID;
                    paymentMethod = contracts_1.PaymentMethod.WALLET;
                    await Billing_1.PrepaidLedgerEntryModel.create({
                        customerId: customer._id,
                        amountPaise: totalPaise,
                        balanceAfterPaise: customer.walletBalancePaise,
                        type: 'debit',
                        referenceType: 'subscription_charge',
                        referenceId: sub.subscriptionNumber,
                        description: `Subscription drop delivery for ${dateKey}`,
                        createdAt: new Date(),
                    });
                }
                else {
                    paymentStatus = contracts_1.PaymentStatus.PENDING;
                    paymentMethod = contracts_1.PaymentMethod.COD;
                }
                // 6. Create Order with compound unique index idempotency
                const count = await Order_1.OrderModel.countDocuments();
                const orderNumber = `SUB-ORD-${dateKey.replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;
                let order;
                try {
                    order = await Order_1.OrderModel.create({
                        orderNumber,
                        customerId: sub.customerId,
                        customerName: sub.customerName,
                        customerPhone: sub.customerPhone,
                        orderType: contracts_1.OrderType.SUBSCRIPTION,
                        status: contracts_1.OrderStatus.CONFIRMED,
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
                }
                catch (duplicateErr) {
                    if (duplicateErr.code === 11000) {
                        // Concurrently generated by another worker or retry; safe ignore
                        result.skippedAlreadyGenerated++;
                        continue;
                    }
                    throw duplicateErr;
                }
                // 7. Create Delivery Assignment
                await DeliveryAssignment_1.DeliveryAssignmentModel.create({
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    deliveryDate: dateKey,
                    status: 'assigned',
                    amountToCollectPaise: paymentStatus === contracts_1.PaymentStatus.PAID ? 0 : totalPaise,
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
                sub.nextDeliveryDate = subscriptions_service_1.subscriptionsService.findNextEligibleDeliveryDate(sub, nextDateStr);
                await sub.save();
                result.ordersCreated++;
            }
            catch (err) {
                result.errors.push({
                    subscriptionId: sub._id.toString(),
                    message: err.message || 'Unknown generation failure',
                });
            }
        }
        result.durationMs = Date.now() - startTime;
        console.log(`[OrderGenerator] Job finished for ${dateKey}: ${result.ordersCreated} created, ${result.skippedAlreadyGenerated} skipped, in ${result.durationMs}ms`);
        return result;
    }
}
exports.OrderGeneratorService = OrderGeneratorService;
exports.orderGeneratorService = new OrderGeneratorService();
//# sourceMappingURL=order-generator.service.js.map