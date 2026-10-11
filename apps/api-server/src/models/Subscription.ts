import mongoose, { Document, Schema, Model } from 'mongoose';
import { PackageSize, SubscriptionFrequency, SubscriptionStatus } from '@ksheeraam/contracts';

export interface ISubscriptionItem {
  productId: mongoose.Types.ObjectId;
  variantId?: mongoose.Types.ObjectId;
  productName: string;
  size: PackageSize;
  quantity: number;
  unitPricePaise: number;
}

export interface ISubscription extends Document {
  subscriptionNumber: string;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  status: SubscriptionStatus;
  frequency: SubscriptionFrequency;
  customDays?: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  items: ISubscriptionItem[];
  addressId: mongoose.Types.ObjectId;
  deliveryAddress: string;
  pincode: string;
  startDate: string; // YYYY-MM-DD (Kolkata)
  endDate?: string; // YYYY-MM-DD
  nextDeliveryDate: string; // YYYY-MM-DD (Kolkata)
  pauseStartDate?: string; // YYYY-MM-DD
  pauseEndDate?: string; // YYYY-MM-DD
  deliverySlot: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionItemSchema = new Schema<ISubscriptionItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId },
    productName: { type: String, required: true },
    size: { type: String, enum: Object.values(PackageSize), required: true },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    unitPricePaise: { type: Number, required: true, validate: Number.isInteger },
  },
  { _id: true }
);

const SubscriptionSchema = new Schema<ISubscription>(
  {
    subscriptionNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.ACTIVE,
      required: true,
      index: true,
    },
    frequency: {
      type: String,
      enum: Object.values(SubscriptionFrequency),
      required: true,
      index: true,
    },
    customDays: [{ type: Number, min: 0, max: 6 }],
    items: [SubscriptionItemSchema],
    addressId: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    deliveryAddress: { type: String, required: true },
    pincode: { type: String, required: true },
    startDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String }, // YYYY-MM-DD
    nextDeliveryDate: { type: String, required: true, index: true }, // YYYY-MM-DD
    pauseStartDate: { type: String },
    pauseEndDate: { type: String },
    deliverySlot: { type: String, default: 'Morning 6:00 AM - 7:30 AM' },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active subscriptions eligible for generation
SubscriptionSchema.index({ status: 1, nextDeliveryDate: 1 });

export const SubscriptionModel: Model<ISubscription> =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
