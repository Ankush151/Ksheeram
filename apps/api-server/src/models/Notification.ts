import mongoose, { Document, Schema, Model } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  channel: 'whatsapp' | 'sms' | 'push';
  title: string;
  body: string;
  sent: boolean;
  status: 'sent' | 'pending' | 'failed';
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channel: {
      type: String,
      enum: ['whatsapp', 'sms', 'push'],
      default: 'whatsapp',
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    sent: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['sent', 'pending', 'failed'],
      default: 'pending',
      index: true,
    },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
