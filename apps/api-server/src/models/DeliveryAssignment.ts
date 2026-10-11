import mongoose, { Document, Schema, Model } from 'mongoose';
import { DeliveryFailureReason, DeliveryStatus } from '@ksheeraam/contracts';

export interface IDeliveryEvent {
  status: DeliveryStatus;
  timestamp: Date;
  notes?: string;
  location?: { lat: number; lng: number };
}

export interface IDeliveryAssignment extends Document {
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  deliveryDate: string; // YYYY-MM-DD
  assignedAgentId?: mongoose.Types.ObjectId;
  assignedAgentName?: string;
  status: DeliveryStatus;
  amountToCollectPaise: number; // 0 if prepaid, >0 if COD
  cashCollectedPaise: number;
  failedReason?: DeliveryFailureReason;
  agentNotes?: string;
  deliveredAt?: Date;
  events: IDeliveryEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryEventSchema = new Schema<IDeliveryEvent>(
  {
    status: {
      type: String,
      enum: Object.values(DeliveryStatus),
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: true }
);

const DeliveryAssignmentSchema = new Schema<IDeliveryAssignment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, index: true },
    orderNumber: { type: String, required: true },
    deliveryDate: { type: String, required: true, index: true },
    assignedAgentId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    assignedAgentName: { type: String },
    status: {
      type: String,
      enum: Object.values(DeliveryStatus),
      default: DeliveryStatus.ASSIGNED,
      required: true,
      index: true,
    },
    amountToCollectPaise: { type: Number, default: 0, validate: Number.isInteger },
    cashCollectedPaise: { type: Number, default: 0, validate: Number.isInteger },
    failedReason: {
      type: String,
      enum: Object.values(DeliveryFailureReason),
    },
    agentNotes: { type: String },
    deliveredAt: { type: Date },
    events: [DeliveryEventSchema],
  },
  {
    timestamps: true,
  }
);

DeliveryAssignmentSchema.index({ assignedAgentId: 1, deliveryDate: 1, status: 1 });
DeliveryAssignmentSchema.index({ deliveryDate: 1, status: 1 });

export const DeliveryAssignmentModel: Model<IDeliveryAssignment> =
  mongoose.models.DeliveryAssignment ||
  mongoose.model<IDeliveryAssignment>('DeliveryAssignment', DeliveryAssignmentSchema);
