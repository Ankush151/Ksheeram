"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersService = exports.OrdersService = void 0;
exports.mapOrderToDto = mapOrderToDto;
const mongoose_1 = __importDefault(require("mongoose"));
const contracts_1 = require("@ksheeraam/contracts");
const Order_1 = require("../../models/Order");
const User_1 = require("../../models/User");
const Address_1 = require("../../models/Address");
const Product_1 = require("../../models/Product");
const DeliveryAssignment_1 = require("../../models/DeliveryAssignment");
const Billing_1 = require("../../models/Billing");
const inventory_service_1 = require("../inventory/inventory.service");
const errors_1 = require("../../utils/errors");
const database_1 = require("../../config/database");
function mapOrderToDto(o) {
    return {
        id: o._id.toString(),
        orderNumber: o.orderNumber,
        customerId: o.customerId.toString(),
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        orderType: o.orderType,
        status: o.status,
        stockAllocated: o.stockAllocated,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        items: o.items.map((i) => ({
            productId: i.productId.toString(),
            variantId: i.variantId?.toString(),
            productName: i.productName,
            size: i.size,
            packagingType: i.packagingType,
            quantity: i.quantity,
            unitPricePaise: i.unitPricePaise,
            subtotalPaise: i.subtotalPaise,
        })),
        addressId: o.addressId?.toString(),
        deliveryAddress: o.deliveryAddress,
        pincode: o.pincode,
        deliveryDate: o.deliveryDate,
        deliverySlot: o.deliverySlot,
        subtotalPaise: o.subtotalPaise,
        deliveryFeePaise: o.deliveryFeePaise,
        totalPaise: o.totalPaise,
        assignedAgentId: o.assignedAgentId?.toString(),
        assignedAgentName: o.assignedAgentName,
        deliveryInstructions: o.deliveryInstructions,
        failedReason: o.failedReason,
        subscriptionId: o.subscriptionId?.toString(),
        idempotencyKey: o.idempotencyKey,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
    };
}
class OrdersService {
    async getCheckoutQuote(userId, items) {
        const user = await User_1.UserModel.findById(userId);
        const quoteItems = [];
        let subtotalPaise = 0;
        for (const item of items) {
            const product = await Product_1.ProductModel.findById(item.productId);
            if (!product)
                throw new errors_1.NotFoundError(`Product ${item.productId} not found.`);
            const variant = product.variants.find((v) => v.size === item.size) || product.variants[0];
            const lineTotal = variant.pricePaise * item.quantity;
            subtotalPaise += lineTotal;
            quoteItems.push({
                productId: product._id.toString(),
                variantId: variant._id?.toString(),
                productName: product.name,
                size: item.size,
                packagingType: item.packagingType || variant.packagingType || contracts_1.PackagingType.GLASS_BOTTLE,
                quantity: item.quantity,
                unitPricePaise: variant.pricePaise,
                subtotalPaise: lineTotal,
            });
        }
        const deliveryFeePaise = subtotalPaise >= 20000 ? 0 : 3000; // Free delivery over ₹200, else ₹30
        const totalPaise = subtotalPaise + deliveryFeePaise;
        const walletBalance = user?.walletBalancePaise || 0;
        return {
            items: quoteItems,
            subtotalPaise,
            deliveryFeePaise,
            totalPaise,
            isWalletSufficient: walletBalance >= totalPaise,
            currentWalletBalancePaise: walletBalance,
        };
    }
    async createOneTimeOrder(userId, data) {
        // Idempotency check
        if (data.idempotencyKey) {
            const existing = await Order_1.OrderModel.findOne({ idempotencyKey: data.idempotencyKey });
            if (existing) {
                return mapOrderToDto(existing);
            }
        }
        return (0, database_1.withTransaction)(async (session) => {
            const user = await User_1.UserModel.findById(userId).session(session || null);
            if (!user)
                throw new errors_1.NotFoundError('User not found.');
            const address = await Address_1.AddressModel.findById(data.addressId).session(session || null);
            if (!address)
                throw new errors_1.NotFoundError('Delivery address not found.');
            const quote = await this.getCheckoutQuote(userId, data.items);
            // Reserve stock atomically
            await inventory_service_1.inventoryService.reserveStock(data.items, `TEMP_CHECKOUT_${Date.now()}`, user.name, session);
            let paymentStatus = contracts_1.PaymentStatus.PENDING;
            if (data.paymentMethod === contracts_1.PaymentMethod.WALLET) {
                if (user.walletBalancePaise < quote.totalPaise) {
                    throw new errors_1.AppError(`Insufficient wallet balance. Required: ₹${(quote.totalPaise / 100).toFixed(2)}, Available: ₹${(user.walletBalancePaise / 100).toFixed(2)}`, 400, 'INSUFFICIENT_WALLET_BALANCE');
                }
                user.walletBalancePaise -= quote.totalPaise;
                await user.save({ session: session || undefined });
                paymentStatus = contracts_1.PaymentStatus.PAID;
            }
            const count = await Order_1.OrderModel.countDocuments();
            const orderNumber = `ORD-${(0, contracts_1.getKolkataDateString)().replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;
            const fullAddress = `${address.flatNumber}, ${address.buildingName}, ${address.streetArea}${address.landmark ? ', near ' + address.landmark : ''}, ${address.city} - ${address.pincode}`;
            const orderDocs = await Order_1.OrderModel.create([
                {
                    orderNumber,
                    customerId: user._id,
                    customerName: user.name,
                    customerPhone: user.phone,
                    orderType: contracts_1.OrderType.ONE_TIME,
                    status: contracts_1.OrderStatus.CONFIRMED,
                    stockAllocated: true,
                    paymentStatus,
                    paymentMethod: data.paymentMethod,
                    items: quote.items.map((i) => ({
                        productId: new mongoose_1.default.Types.ObjectId(i.productId),
                        variantId: i.variantId ? new mongoose_1.default.Types.ObjectId(i.variantId) : undefined,
                        productName: i.productName,
                        size: i.size,
                        packagingType: i.packagingType,
                        quantity: i.quantity,
                        unitPricePaise: i.unitPricePaise,
                        subtotalPaise: i.subtotalPaise,
                    })),
                    addressId: address._id,
                    deliveryAddress: fullAddress,
                    pincode: address.pincode,
                    deliveryDate: data.deliveryDate || (0, contracts_1.getKolkataTomorrowDateString)(),
                    deliverySlot: data.deliverySlot || 'Morning 6:00 AM - 7:30 AM',
                    subtotalPaise: quote.subtotalPaise,
                    deliveryFeePaise: quote.deliveryFeePaise,
                    totalPaise: quote.totalPaise,
                    deliveryInstructions: data.instructions,
                    idempotencyKey: data.idempotencyKey,
                },
            ], session ? { session } : {});
            const order = orderDocs[0];
            // Record wallet ledger entry if paid via wallet
            if (data.paymentMethod === contracts_1.PaymentMethod.WALLET) {
                await Billing_1.PrepaidLedgerEntryModel.create([
                    {
                        customerId: user._id,
                        amountPaise: quote.totalPaise,
                        balanceAfterPaise: user.walletBalancePaise,
                        type: 'debit',
                        referenceType: 'order_charge',
                        referenceId: order._id.toString(),
                        description: `Paid for Order #${order.orderNumber}`,
                        createdAt: new Date(),
                    },
                ], session ? { session } : {});
            }
            // Automatically create DeliveryAssignment
            await DeliveryAssignment_1.DeliveryAssignmentModel.create([
                {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    deliveryDate: order.deliveryDate,
                    status: 'assigned',
                    amountToCollectPaise: data.paymentMethod === contracts_1.PaymentMethod.COD ? order.totalPaise : 0,
                    cashCollectedPaise: 0,
                    events: [{ status: 'assigned', timestamp: new Date(), notes: 'Order created and assigned to manifest' }],
                },
            ], session ? { session } : {});
            return mapOrderToDto(order);
        });
    }
    async listOrders(requestingUserId, requestingRole, filters) {
        const query = {};
        if (requestingRole === contracts_1.Role.CUSTOMER) {
            query.customerId = requestingUserId;
        }
        else if (requestingRole === contracts_1.Role.DELIVERY_AGENT) {
            // Delivery agent only sees their assigned orders
            query.assignedAgentId = requestingUserId;
        }
        else {
            // Admin filters
            if (filters?.customerId)
                query.customerId = filters.customerId;
            if (filters?.assignedAgentId)
                query.assignedAgentId = filters.assignedAgentId;
        }
        if (filters?.deliveryDate)
            query.deliveryDate = filters.deliveryDate;
        if (filters?.status)
            query.status = filters.status;
        const orders = await Order_1.OrderModel.find(query).sort({ deliveryDate: -1, createdAt: -1 });
        return orders.map(mapOrderToDto);
    }
    async getOrderById(orderId, requestingUserId, requestingRole) {
        const order = await Order_1.OrderModel.findById(orderId);
        if (!order)
            throw new errors_1.NotFoundError('Order not found.');
        if (requestingRole === contracts_1.Role.CUSTOMER && order.customerId.toString() !== requestingUserId) {
            throw new errors_1.ForbiddenError('You can only access your own orders.');
        }
        if (requestingRole === contracts_1.Role.DELIVERY_AGENT &&
            order.assignedAgentId?.toString() !== requestingUserId) {
            throw new errors_1.ForbiddenError('You can only access orders assigned to your route.');
        }
        return mapOrderToDto(order);
    }
    async allocateStockForOrder(orderId) {
        const order = await Order_1.OrderModel.findById(orderId);
        if (!order)
            throw new errors_1.NotFoundError('Order not found.');
        if (order.stockAllocated)
            return mapOrderToDto(order);
        await inventory_service_1.inventoryService.reserveStock(order.items.map((i) => ({
            productId: i.productId.toString(),
            size: i.size,
            packagingType: i.packagingType || contracts_1.PackagingType.GLASS_BOTTLE,
            quantity: i.quantity,
        })), `ORDER_MANUAL_ALLOC_${order.orderNumber}`, 'ADMIN_PORTAL');
        order.stockAllocated = true;
        await order.save();
        return mapOrderToDto(order);
    }
}
exports.OrdersService = OrdersService;
exports.ordersService = new OrdersService();
//# sourceMappingURL=orders.service.js.map