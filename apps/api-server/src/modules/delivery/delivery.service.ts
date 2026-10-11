import mongoose from 'mongoose';
import {
  AssignAgentDto,
  CompleteDeliveryDto,
  DeliveryFailureReason,
  DeliveryStatus,
  FailDeliveryDto,
  ManifestOrderItemDto,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Role,
  getKolkataDateString,
} from '@ksheeraam/contracts';
import { DeliveryAssignmentModel } from '../../models/DeliveryAssignment';
import { OrderModel } from '../../models/Order';
import { UserModel } from '../../models/User';
import { inventoryService } from '../inventory/inventory.service';
import { AppError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { withTransaction } from '../../config/database';

export class DeliveryService {
  async getDailyManifest(
    deliveryDate: string,
    requestingUserId: string,
    requestingRole: Role
  ): Promise<ManifestOrderItemDto[]> {
    const query: any = { deliveryDate };

    if (requestingRole === Role.DELIVERY_AGENT) {
      query.assignedAgentId = requestingUserId;
    }

    const assignments = await DeliveryAssignmentModel.find(query).sort({ orderNumber: 1 });
    const orderIds = assignments.map((a) => a.orderId);
    const orders = await OrderModel.find({ _id: { $in: orderIds } });
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
        paymentStatus: order ? order.paymentStatus : PaymentStatus.PENDING,
        paymentMethod: order ? order.paymentMethod : PaymentMethod.COD,
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

  async assignAgent(data: AssignAgentDto): Promise<{ updatedCount: number }> {
    const agent = await UserModel.findById(data.agentId);
    if (!agent) throw new NotFoundError('Delivery agent not found.');

    const res = await DeliveryAssignmentModel.updateMany(
      { orderId: { $in: data.orderIds.map((id) => new mongoose.Types.ObjectId(id)) } },
      {
        $set: {
          assignedAgentId: agent._id,
          assignedAgentName: agent.name,
          status: DeliveryStatus.ASSIGNED,
        },
        $push: {
          events: {
            status: DeliveryStatus.ASSIGNED,
            timestamp: new Date(),
            notes: `Assigned to agent ${agent.name}`,
          },
        },
      }
    );

    // Also update Order documents
    await OrderModel.updateMany(
      { _id: { $in: data.orderIds.map((id) => new mongoose.Types.ObjectId(id)) } },
      {
        $set: {
          assignedAgentId: agent._id,
          assignedAgentName: agent.name,
        },
      }
    );

    return { updatedCount: res.modifiedCount };
  }

  async completeDelivery(
    data: CompleteDeliveryDto,
    requestingUserId: string,
    requestingRole: Role
  ): Promise<ManifestOrderItemDto> {
    return withTransaction(async (session) => {
      const assignment = await DeliveryAssignmentModel.findOne({
        orderId: new mongoose.Types.ObjectId(data.orderId),
      }).session(session || null);

      if (!assignment) throw new NotFoundError('Delivery assignment record not found.');

      if (
        requestingRole === Role.DELIVERY_AGENT &&
        assignment.assignedAgentId?.toString() !== requestingUserId
      ) {
        throw new ForbiddenError('You can only complete deliveries assigned to you.');
      }

      const order = await OrderModel.findById(data.orderId).session(session || null);
      if (!order) throw new NotFoundError('Order not found.');

      assignment.status = DeliveryStatus.DELIVERED;
      assignment.deliveredAt = new Date();
      assignment.agentNotes = data.agentNotes;

      if (data.cashCollectedPaise !== undefined) {
        assignment.cashCollectedPaise = data.cashCollectedPaise;
      } else if (assignment.amountToCollectPaise > 0) {
        assignment.cashCollectedPaise = assignment.amountToCollectPaise;
      }

      assignment.events.push({
        status: DeliveryStatus.DELIVERED,
        timestamp: new Date(),
        notes: data.agentNotes || 'Doorstep delivery completed successfully',
      });

      await assignment.save({ session: session || undefined });

      // Update Order status
      order.status = OrderStatus.DELIVERED;
      if (order.paymentMethod === PaymentMethod.COD && assignment.cashCollectedPaise > 0) {
        order.paymentStatus = PaymentStatus.PAID;
      }
      await order.save({ session: session || undefined });

      // Fulfill reserved stock into morning dispatch
      if (order.stockAllocated) {
        await inventoryService.fulfillReservation(
          order.items.map((i) => ({
            productId: i.productId.toString(),
            size: i.size,
            packagingType: i.packagingType,
            quantity: i.quantity,
          })),
          order.orderNumber,
          requestingUserId,
          session
        );
      }

      const manifestItems = await this.getDailyManifest(
        assignment.deliveryDate,
        requestingUserId,
        requestingRole
      );
      return manifestItems.find((m) => m.orderId === data.orderId)!;
    });
  }

  async failDelivery(
    data: FailDeliveryDto,
    requestingUserId: string,
    requestingRole: Role
  ): Promise<ManifestOrderItemDto> {
    return withTransaction(async (session) => {
      const assignment = await DeliveryAssignmentModel.findOne({
        orderId: new mongoose.Types.ObjectId(data.orderId),
      }).session(session || null);

      if (!assignment) throw new NotFoundError('Delivery assignment record not found.');

      if (
        requestingRole === Role.DELIVERY_AGENT &&
        assignment.assignedAgentId?.toString() !== requestingUserId
      ) {
        throw new ForbiddenError('You can only update deliveries assigned to you.');
      }

      const order = await OrderModel.findById(data.orderId).session(session || null);
      if (!order) throw new NotFoundError('Order not found.');

      assignment.status = DeliveryStatus.FAILED;
      assignment.failedReason = data.reason;
      assignment.agentNotes = data.notes;
      assignment.events.push({
        status: DeliveryStatus.FAILED,
        timestamp: new Date(),
        notes: `Delivery attempt failed: ${data.reason} - ${data.notes || ''}`,
      });

      await assignment.save({ session: session || undefined });

      order.status = OrderStatus.PLACED; // Returned for re-attempt or cancellation
      order.failedReason = `${data.reason}: ${data.notes || ''}`;
      await order.save({ session: session || undefined });

      // Handle stock return
      if (order.stockAllocated) {
        const isDamaged = data.reason === DeliveryFailureReason.BOTTLE_LEAKAGE;
        if (isDamaged) {
          // Adjust stock to damaged
          for (const item of order.items) {
            const bal = await inventoryService.getOrCreateBalance(
              item.productId.toString(),
              item.size,
              item.packagingType,
              session
            );
            await inventoryService.adjustStock(
              bal._id.toString(),
              'mark_damaged',
              item.quantity,
              `Delivery failed with breakage/leakage: ${data.notes || ''}`,
              requestingUserId
            );
          }
        } else {
          // Release reservation back to available
          await inventoryService.releaseReservation(
            order.items.map((i) => ({
              productId: i.productId.toString(),
              size: i.size,
              packagingType: i.packagingType,
              quantity: i.quantity,
            })),
            order.orderNumber,
            `Delivery failed: ${data.reason}`,
            requestingUserId,
            session
          );
        }
      }

      const manifestItems = await this.getDailyManifest(
        assignment.deliveryDate,
        requestingUserId,
        requestingRole
      );
      return manifestItems.find((m) => m.orderId === data.orderId)!;
    });
  }
}

export const deliveryService = new DeliveryService();
