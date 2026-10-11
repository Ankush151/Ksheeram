import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  OrderStatus,
  OrderType,
  PackageSize,
  PackagingType,
  PaymentMethod,
  PaymentStatus,
} from '@ksheeraam/contracts';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  variantId?: mongoose.Types.ObjectId;
  productName: string;
  size: PackageSize;
  packagingType: PackagingType;
  quantity: number;
  unitPricePaise: number;
  subtotalPaise: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  status: OrderStatus;
  stockAllocated: boolean;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: IOrderItem[];
  addressId?: mongoose.Types.ObjectId;
  deliveryAddress: string;
  pincode: string;
  deliveryDate: string; // YYYY-MM-DD (Kolkata)
  deliverySlot: string;
  subtotalPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
  assignedAgentId?: mongoose.Types.ObjectId;
  assignedAgentName?: string;
  deliveryInstructions?: string;
  failedReason?: string;
  subscriptionId?: mongoose.Types.ObjectId;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId },
    productName: { type: String, required: true },
    size: { type: String, enum: Object.values(PackageSize), required: true },
    packagingType: {
      type: String,
      enum: Object.values(PackagingType),
      default: PackagingType.GLASS_BOTTLE,
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    unitPricePaise: { type: Number, required: true, validate: Number.isInteger },
    subtotalPaise: { type: Number, required: true, validate: Number.isInteger },
  },
  { _id: true }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    orderType: {
      type: String,
      enum: Object.values(OrderType),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PLACED,
      required: true,
      index: true,
    },
    stockAllocated: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
      index: true,
    },
    items: [OrderItemSchema],
    addressId: { type: Schema.Types.ObjectId, ref: 'Address' },
    deliveryAddress: { type: String, required: true },
    pincode: { type: String, required: true },
    deliveryDate: { type: String, required: true, index: true }, // YYYY-MM-DD
    deliverySlot: { type: String, default: 'Morning 6:00 AM - 7:30 AM' },
    subtotalPaise: { type: Number, required: true, validate: Number.isInteger },
    deliveryFeePaise: { type: Number, default: 0, validate: Number.isInteger },
    totalPaise: { type: Number, required: true, validate: Number.isInteger },
    assignedAgentId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    assignedAgentName: { type: String },
    deliveryInstructions: { type: String },
    failedReason: { type: String },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', index: true },
    idempotencyKey: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ deliveryDate: 1, status: 1 });
OrderSchema.index({ assignedAgentId: 1, deliveryDate: 1 });

// Critical Idempotency: Only ONE order can ever be created for a subscription on a given delivery date!
OrderSchema.index(
  { subscriptionId: 1, deliveryDate: 1 },
  {
    unique: true,
    partialFilterExpression: { subscriptionId: { $type: 'objectId' } },
  }
);

// Idempotency key uniqueness for one-time orders
OrderSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string', $gt: '' } },
  }
);

export const OrderModel: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
