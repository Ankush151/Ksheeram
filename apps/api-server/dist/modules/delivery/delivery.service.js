"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryService = exports.DeliveryService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const contracts_1 = require("@ksheeraam/contracts");
const DeliveryAssignment_1 = require("../../models/DeliveryAssignment");
const Order_1 = require("../../models/Order");
const User_1 = require("../../models/User");
const inventory_service_1 = require("../inventory/inventory.service");
const errors_1 = require("../../utils/errors");
const database_1 = require("../../config/database");
class DeliveryService {
    async getDailyManifest(deliveryDate, requestingUserId, requestingRole) {
        const query = { deliveryDate };
        if (requestingRole === contracts_1.Role.DELIVERY_AGENT) {
            query.assignedAgentId = requestingUserId;
        }
        const assignments = await DeliveryAssignment_1.DeliveryAssignmentModel.find(query).sort({ orderNumber: 1 });
        const orderIds = assignments.map((a) => a.orderId);
        const orders = await Order_1.OrderModel.find({ _id: { $in: orderIds } });
        const orderMap = new Map(orders.map((o) => [o._id.toString(), o]));
        return assignments.map((assignment) => {
            const order = orderMap.get(assignment.orderId.toString());
            return {
                orderId: assignment.orderId.toString(),
                orderNumber: assignment.orderNumber,
                customerId: order ? order.customerId.toString() : '',
                customerName: order ? order.customerName : '',
                customerPhone: order ? order.customerPhone : '',
                deliveryAddress: order ? order.deliveryAddress : '',
                pincode: order ? order.pincode : '',
                deliveryInstructions: order ? order.deliveryInstructions : undefined,
                items: order
                    ? order.items.map((i) => ({
                        productName: i.productName,
                        size: i.size,
                        quantity: i.quantity,
                    }))
                    : [],
                paymentStatus: order ? order.paymentStatus : contracts_1.PaymentStatus.PENDING,
                paymentMethod: order ? order.paymentMethod : contracts_1.PaymentMethod.COD,
                amountToCollectPaise: assignment.amountToCollectPaise,
                status: assignment.status,
                assignedAgentId: assignment.assignedAgentId?.toString(),
                assignedAgentName: assignment.assignedAgentName,
                deliveryDate: assignment.deliveryDate,
                deliverySlot: order ? order.deliverySlot : 'Morning 6:00 AM - 7:30 AM',
                deliveredAt: assignment.deliveredAt ? assignment.deliveredAt.toISOString() : undefined,
                failedReason: assignment.failedReason,
                agentNotes: assignment.agentNotes,
            };
        });
    }
    async assignAgent(data) {
        const agent = await User_1.UserModel.findById(data.agentId);
        if (!agent)
            throw new errors_1.NotFoundError('Delivery agent not found.');
        const res = await DeliveryAssignment_1.DeliveryAssignmentModel.updateMany({ orderId: { $in: data.orderIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) } }, {
            $set: {
                assignedAgentId: agent._id,
                assignedAgentName: agent.name,
                status: contracts_1.DeliveryStatus.ASSIGNED,
            },
            $push: {
                events: {
                    status: contracts_1.DeliveryStatus.ASSIGNED,
                    timestamp: new Date(),
                    notes: `Assigned to agent ${agent.name}`,
                },
            },
        });
        // Also update Order documents
        await Order_1.OrderModel.updateMany({ _id: { $in: data.orderIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) } }, {
            $set: {
                assignedAgentId: agent._id,
                assignedAgentName: agent.name,
            },
        });
        return { updatedCount: res.modifiedCount };
    }
    async completeDelivery(data, requestingUserId, requestingRole) {
        return (0, database_1.withTransaction)(async (session) => {
            const assignment = await DeliveryAssignment_1.DeliveryAssignmentModel.findOne({
                orderId: new mongoose_1.default.Types.ObjectId(data.orderId),
            }).session(session || null);
            if (!assignment)
                throw new errors_1.NotFoundError('Delivery assignment record not found.');
            if (requestingRole === contracts_1.Role.DELIVERY_AGENT &&
                assignment.assignedAgentId?.toString() !== requestingUserId) {
                throw new errors_1.ForbiddenError('You can only complete deliveries assigned to you.');
            }
            const order = await Order_1.OrderModel.findById(data.orderId).session(session || null);
            if (!order)
                throw new errors_1.NotFoundError('Order not found.');
            assignment.status = contracts_1.DeliveryStatus.DELIVERED;
            assignment.deliveredAt = new Date();
            assignment.agentNotes = data.agentNotes;
            if (data.cashCollectedPaise !== undefined) {
                assignment.cashCollectedPaise = data.cashCollectedPaise;
            }
            else if (assignment.amountToCollectPaise > 0) {
                assignment.cashCollectedPaise = assignment.amountToCollectPaise;
            }
            assignment.events.push({
                status: contracts_1.DeliveryStatus.DELIVERED,
                timestamp: new Date(),
                notes: data.agentNotes || 'Doorstep delivery completed successfully',
            });
            await assignment.save({ session: session || undefined });
            // Update Order status
            order.status = contracts_1.OrderStatus.DELIVERED;
            if (order.paymentMethod === contracts_1.PaymentMethod.COD && assignment.cashCollectedPaise > 0) {
                order.paymentStatus = contracts_1.PaymentStatus.PAID;
            }
            await order.save({ session: session || undefined });
            // Fulfill reserved stock into morning dispatch
            if (order.stockAllocated) {
                await inventory_service_1.inventoryService.fulfillReservation(order.items.map((i) => ({
                    productId: i.productId.toString(),
                    size: i.size,
                    packagingType: i.packagingType,
                    quantity: i.quantity,
                })), order.orderNumber, requestingUserId, session);
            }
            const manifestItems = await this.getDailyManifest(assignment.deliveryDate, requestingUserId, requestingRole);
            return manifestItems.find((m) => m.orderId === data.orderId);
        });
    }
    async failDelivery(data, requestingUserId, requestingRole) {
        return (0, database_1.withTransaction)(async (session) => {
            const assignment = await DeliveryAssignment_1.DeliveryAssignmentModel.findOne({
                orderId: new mongoose_1.default.Types.ObjectId(data.orderId),
            }).session(session || null);
            if (!assignment)
                throw new errors_1.NotFoundError('Delivery assignment record not found.');
            if (requestingRole === contracts_1.Role.DELIVERY_AGENT &&
                assignment.assignedAgentId?.toString() !== requestingUserId) {
                throw new errors_1.ForbiddenError('You can only update deliveries assigned to you.');
            }
            const order = await Order_1.OrderModel.findById(data.orderId).session(session || null);
            if (!order)
                throw new errors_1.NotFoundError('Order not found.');
            assignment.status = contracts_1.DeliveryStatus.FAILED;
            assignment.failedReason = data.reason;
            assignment.agentNotes = data.notes;
            assignment.events.push({
                status: contracts_1.DeliveryStatus.FAILED,
                timestamp: new Date(),
                notes: `Delivery attempt failed: ${data.reason} - ${data.notes || ''}`,
            });
            await assignment.save({ session: session || undefined });
            order.status = contracts_1.OrderStatus.PLACED; // Returned for re-attempt or cancellation
            order.failedReason = `${data.reason}: ${data.notes || ''}`;
            await order.save({ session: session || undefined });
            // Handle stock return
            if (order.stockAllocated) {
                const isDamaged = data.reason === contracts_1.DeliveryFailureReason.BOTTLE_LEAKAGE;
                if (isDamaged) {
                    // Adjust stock to damaged
                    for (const item of order.items) {
                        const bal = await inventory_service_1.inventoryService.getOrCreateBalance(item.productId.toString(), item.size, item.packagingType, session);
                        await inventory_service_1.inventoryService.adjustStock(bal._id.toString(), 'mark_damaged', item.quantity, `Delivery failed with breakage/leakage: ${data.notes || ''}`, requestingUserId);
                    }
                }
                else {
                    // Release reservation back to available
                    await inventory_service_1.inventoryService.releaseReservation(order.items.map((i) => ({
                        productId: i.productId.toString(),
                        size: i.size,
                        packagingType: i.packagingType,
                        quantity: i.quantity,
                    })), order.orderNumber, `Delivery failed: ${data.reason}`, requestingUserId, session);
                }
            }
            const manifestItems = await this.getDailyManifest(assignment.deliveryDate, requestingUserId, requestingRole);
            return manifestItems.find((m) => m.orderId === data.orderId);
        });
    }
}
exports.DeliveryService = DeliveryService;
exports.deliveryService = new DeliveryService();
//# sourceMappingURL=delivery.service.js.map