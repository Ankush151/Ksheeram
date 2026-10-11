import mongoose, { ClientSession } from 'mongoose';
import {
  CheckoutQuoteDto,
  CreateOrderDto,
  OrderDto,
  OrderItemDto,
  OrderStatus,
  OrderType,
  PackageSize,
  PackagingType,
  PaymentMethod,
  PaymentStatus,
  Role,
  getKolkataDateString,
  getKolkataTomorrowDateString,
} from '@ksheeraam/contracts';
import { IOrder, OrderModel } from '../../models/Order';
import { UserModel } from '../../models/User';
import { AddressModel } from '../../models/Address';
import { ProductModel } from '../../models/Product';
import { DeliveryAssignmentModel } from '../../models/DeliveryAssignment';
import { PrepaidLedgerEntryModel } from '../../models/Billing';
import { inventoryService } from '../inventory/inventory.service';
import { AppError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { withTransaction } from '../../config/database';

export function mapOrderToDto(o: IOrder): OrderDto {
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
    items: o.items.map((i: any) => ({
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

export class OrdersService {
  async getCheckoutQuote(
    userId: string,
    items: { productId: string; size: PackageSize; packagingType?: PackagingType; quantity: number }[]
  ): Promise<CheckoutQuoteDto> {
    const user = await UserModel.findById(userId);
    const quoteItems: OrderItemDto[] = [];
    let subtotalPaise = 0;

    for (const item of items) {
      const product = await ProductModel.findById(item.productId);
      if (!product) throw new NotFoundError(`Product ${item.productId} not found.`);

      const variant =
        product.variants.find((v) => v.size === item.size) || product.variants[0];
      const lineTotal = variant.pricePaise * item.quantity;
      subtotalPaise += lineTotal;

      quoteItems.push({
        productId: product._id.toString(),
        variantId: variant._id?.toString(),
        productName: product.name,
        size: item.size,
        packagingType: item.packagingType || variant.packagingType || PackagingType.GLASS_BOTTLE,
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

  async createOneTimeOrder(userId: string, data: CreateOrderDto): Promise<OrderDto> {
    // Idempotency check
    if (data.idempotencyKey) {
      const existing = await OrderModel.findOne({ idempotencyKey: data.idempotencyKey });
      if (existing) {
        return mapOrderToDto(existing);
      }
    }

    return withTransaction(async (session) => {
      const user = await UserModel.findById(userId).session(session || null);
      if (!user) throw new NotFoundError('User not found.');

      const address = await AddressModel.findById(data.addressId).session(session || null);
      if (!address) throw new NotFoundError('Delivery address not found.');

      const quote = await this.getCheckoutQuote(userId, data.items);

      // Reserve stock atomically
      await inventoryService.reserveStock(
        data.items,
        `TEMP_CHECKOUT_${Date.now()}`,
        user.name,
        session
      );

      let paymentStatus = PaymentStatus.PENDING;
      if (data.paymentMethod === PaymentMethod.WALLET) {
        if (user.walletBalancePaise < quote.totalPaise) {
          throw new AppError(
            `Insufficient wallet balance. Required: ₹${(quote.totalPaise / 100).toFixed(2)}, Available: ₹${(user.walletBalancePaise / 100).toFixed(2)}`,
            400,
            'INSUFFICIENT_WALLET_BALANCE'
          );
        }

        user.walletBalancePaise -= quote.totalPaise;
        await user.save({ session: session || undefined });

        paymentStatus = PaymentStatus.PAID;
      }

      const count = await OrderModel.countDocuments();
      const orderNumber = `ORD-${getKolkataDateString().replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

      const fullAddress = `${address.flatNumber}, ${address.buildingName}, ${address.streetArea}${address.landmark ? ', near ' + address.landmark : ''}, ${address.city} - ${address.pincode}`;

      const orderDocs = await OrderModel.create(
        [
          {
            orderNumber,
            customerId: user._id,
            customerName: user.name,
            customerPhone: user.phone,
            orderType: OrderType.ONE_TIME,
            status: OrderStatus.CONFIRMED,
            stockAllocated: true,
            paymentStatus,
            paymentMethod: data.paymentMethod,
            items: quote.items.map((i) => ({
              productId: new mongoose.Types.ObjectId(i.productId),
              variantId: i.variantId ? new mongoose.Types.ObjectId(i.variantId) : undefined,
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
            deliveryDate: data.deliveryDate || getKolkataTomorrowDateString(),
            deliverySlot: data.deliverySlot || 'Morning 6:00 AM - 7:30 AM',
            subtotalPaise: quote.subtotalPaise,
            deliveryFeePaise: quote.deliveryFeePaise,
            totalPaise: quote.totalPaise,
            deliveryInstructions: data.instructions,
            idempotencyKey: data.idempotencyKey,
          },
        ],
        session ? { session } : {}
      );

      const order = orderDocs[0];

      // Record wallet ledger entry if paid via wallet
      if (data.paymentMethod === PaymentMethod.WALLET) {
        await PrepaidLedgerEntryModel.create(
          [
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
          ],
          session ? { session } : {}
        );
      }

      // Automatically create DeliveryAssignment
      await DeliveryAssignmentModel.create(
        [
          {
            orderId: order._id,
            orderNumber: order.orderNumber,
            deliveryDate: order.deliveryDate,
            status: 'assigned',
            amountToCollectPaise: data.paymentMethod === PaymentMethod.COD ? order.totalPaise : 0,
            cashCollectedPaise: 0,
            events: [{ status: 'assigned', timestamp: new Date(), notes: 'Order created and assigned to manifest' }],
          },
        ],
        session ? { session } : {}
      );

      return mapOrderToDto(order);
    });
  }

  async listOrders(
    requestingUserId: string,
    requestingRole: Role,
    filters?: {
      customerId?: string;
      deliveryDate?: string;
      status?: OrderStatus;
      assignedAgentId?: string;
    }
  ): Promise<OrderDto[]> {
    const query: any = {};

    if (requestingRole === Role.CUSTOMER) {
      query.customerId = requestingUserId;
    } else if (requestingRole === Role.DELIVERY_AGENT) {
      // Delivery agent only sees their assigned orders
      query.assignedAgentId = requestingUserId;
    } else {
      // Admin filters
      if (filters?.customerId) query.customerId = filters.customerId;
      if (filters?.assignedAgentId) query.assignedAgentId = filters.assignedAgentId;
    }

    if (filters?.deliveryDate) query.deliveryDate = filters.deliveryDate;
    if (filters?.status) query.status = filters.status;

    const orders = await OrderModel.find(query).sort({ deliveryDate: -1, createdAt: -1 });
    return orders.map(mapOrderToDto);
  }

  async getOrderById(orderId: string, requestingUserId: string, requestingRole: Role): Promise<OrderDto> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order not found.');

    if (requestingRole === Role.CUSTOMER && order.customerId.toString() !== requestingUserId) {
      throw new ForbiddenError('You can only access your own orders.');
    }
    if (
      requestingRole === Role.DELIVERY_AGENT &&
      order.assignedAgentId?.toString() !== requestingUserId
    ) {
      throw new ForbiddenError('You can only access orders assigned to your route.');
    }

    return mapOrderToDto(order);
  }

  async allocateStockForOrder(orderId: string): Promise<OrderDto> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order not found.');
    if (order.stockAllocated) return mapOrderToDto(order);

    await inventoryService.reserveStock(
      order.items.map((i: any) => ({
        productId: i.productId.toString(),
        size: i.size,
        packagingType: i.packagingType || PackagingType.GLASS_BOTTLE,
        quantity: i.quantity,
      })),
      `ORDER_MANUAL_ALLOC_${order.orderNumber}`,
      'ADMIN_PORTAL'
    );

    order.stockAllocated = true;
    await order.save();
    return mapOrderToDto(order);
  }
}

export const ordersService = new OrdersService();
