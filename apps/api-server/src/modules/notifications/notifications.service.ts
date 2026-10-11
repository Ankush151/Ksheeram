import mongoose from 'mongoose';
import { INotification, NotificationModel } from '../../models/Notification';
import { NotFoundError } from '../../utils/errors';

export class NotificationsService {
  async listUserNotifications(userId: string): Promise<INotification[]> {
    return NotificationModel.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(30);
  }

  async sendNotification(params: {
    userId: string;
    channel?: 'whatsapp' | 'sms' | 'push';
    title: string;
    body: string;
    metadata?: any;
  }): Promise<INotification> {
    return NotificationModel.create({
      userId: new mongoose.Types.ObjectId(params.userId),
      channel: params.channel || 'whatsapp',
      title: params.title,
      body: params.body,
      sent: true,
      status: 'sent',
      metadata: params.metadata,
    });
  }
}

export const notificationsService = new NotificationsService();
