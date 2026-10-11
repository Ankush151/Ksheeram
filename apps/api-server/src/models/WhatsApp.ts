import mongoose, { Document, Schema, Model } from 'mongoose';
import { WhatsAppMessageStatus } from '@ksheeraam/contracts';

export interface IWhatsAppMessageRecord extends Document {
  messageId: string; // Meta WhatsApp message id (unique for deduplication)
  senderPhone: string;
  customerName?: string;
  customerId?: mongoose.Types.ObjectId;
  rawMessage: string;
  status: WhatsAppMessageStatus;
  handledBy?: mongoose.Types.ObjectId;
  convertedOrderId?: mongoose.Types.ObjectId;
  detectedIntent?: string;
  receivedAt: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppMessageRecordSchema = new Schema<IWhatsAppMessageRecord>(
  {
    messageId: { type: String, required: true, unique: true, index: true },
    senderPhone: { type: String, required: true, index: true },
    customerName: { type: String },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    rawMessage: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(WhatsAppMessageStatus),
      default: WhatsAppMessageStatus.NEW,
      required: true,
      index: true,
    },
    handledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    convertedOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    detectedIntent: { type: String },
    receivedAt: { type: Date, default: Date.now, index: true },
    processedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

WhatsAppMessageRecordSchema.index({ status: 1, receivedAt: -1 });

export const WhatsAppMessageRecordModel: Model<IWhatsAppMessageRecord> =
  mongoose.models.WhatsAppMessageRecord ||
  mongoose.model<IWhatsAppMessageRecord>('WhatsAppMessageRecord', WhatsAppMessageRecordSchema);
