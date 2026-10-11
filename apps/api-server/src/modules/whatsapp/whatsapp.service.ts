import mongoose from 'mongoose';
import {
  WhatsAppInboundWebhookDto,
  WhatsAppMessageRecordDto,
  WhatsAppMessageStatus,
} from '@ksheeraam/contracts';
import { IWhatsAppMessageRecord, WhatsAppMessageRecordModel } from '../../models/WhatsApp';
import { UserModel } from '../../models/User';
import { ordersService } from '../orders/orders.service';
import { env } from '../../config/env';
import { AppError, NotFoundError } from '../../utils/errors';

export function mapWARecordToDto(rec: IWhatsAppMessageRecord): WhatsAppMessageRecordDto {
  return {
    id: rec._id.toString(),
    messageId: rec.messageId,
    senderPhone: rec.senderPhone,
    customerName: rec.customerName,
    customerId: rec.customerId?.toString(),
    rawMessage: rec.rawMessage,
    status: rec.status,
    handledBy: rec.handledBy?.toString(),
    convertedOrderId: rec.convertedOrderId?.toString(),
    receivedAt: rec.receivedAt.toISOString(),
  };
}

export class WhatsAppService {
  verifyWebhook(mode?: string, token?: string, challenge?: string): string | null {
    if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
      return challenge || null;
    }
    return null;
  }

  async processInboundWebhook(data: WhatsAppInboundWebhookDto): Promise<{ processed: number; duplicates: number }> {
    let processed = 0;
    let duplicates = 0;

    for (const entry of data.entry || []) {
      for (const change of entry.changes || []) {
        const val = change.value;
        const messages = val.messages || [];

        for (const msg of messages) {
          const messageId = msg.id;
          const fromPhone = msg.from;
          const textBody = msg.text?.body?.trim() || '';

          // Deduplication: check if messageId already processed
          const existing = await WhatsAppMessageRecordModel.findOne({ messageId });
          if (existing) {
            duplicates++;
            continue;
          }

          // Customer identity resolution
          const cleanPhone = fromPhone.replace(/\D/g, '').slice(-10);
          const customer = await UserModel.findOne({
            phone: { $regex: cleanPhone + '$' },
          });

          // Opt-out handling
          if (textBody.toUpperCase() === 'STOP' || textBody.toUpperCase() === 'UNSUBSCRIBE') {
            if (customer) {
              customer.whatsappOptOut = true;
              await customer.save();
            }
          }

          // Detect intent
          let detectedIntent = 'general_inquiry';
          const lower = textBody.toLowerCase();
          if (lower.includes('milk') || lower.includes('litre') || lower.includes('order') || lower.includes('bottle')) {
            detectedIntent = 'order_request';
          } else if (lower.includes('pause') || lower.includes('stop delivery')) {
            detectedIntent = 'pause_request';
          }

          await WhatsAppMessageRecordModel.create({
            messageId,
            senderPhone: fromPhone,
            customerName: customer ? customer.name : val.contacts?.[0]?.profile?.name || 'WhatsApp Customer',
            customerId: customer?._id,
            rawMessage: textBody,
            status: WhatsAppMessageStatus.NEW,
            detectedIntent,
            receivedAt: new Date(),
          });

          processed++;
        }
      }
    }

    return { processed, duplicates };
  }

  async listMessages(status?: WhatsAppMessageStatus): Promise<WhatsAppMessageRecordDto[]> {
    const query: any = {};
    if (status) query.status = status;
    const records = await WhatsAppMessageRecordModel.find(query).sort({ receivedAt: -1 });
    return records.map(mapWARecordToDto);
  }

  /**
   * Admin-assisted ordering: Converts an inbound conversational WhatsApp request into a verified order
   * using the shared ordersService.
   */
  async convertToOrder(
    messageRecordId: string,
    adminUserId: string,
    orderParams: any
  ): Promise<{ message: WhatsAppMessageRecordDto; order: any }> {
    const record = await WhatsAppMessageRecordModel.findById(messageRecordId);
    if (!record) throw new NotFoundError('WhatsApp message record not found.');
    if (record.status === WhatsAppMessageStatus.CONVERTED) {
      throw new AppError('WhatsApp request has already been converted into an order.', 409, 'ALREADY_CONVERTED');
    }

    const targetUserId = record.customerId ? record.customerId.toString() : adminUserId;

    // Utilize the exact same order service as web checkout
    const createdOrder = await ordersService.createOneTimeOrder(targetUserId, {
      ...orderParams,
      instructions: `WhatsApp order assisted from message: "${record.rawMessage}"`,
    });

    record.status = WhatsAppMessageStatus.CONVERTED;
    record.handledBy = new mongoose.Types.ObjectId(adminUserId);
    record.convertedOrderId = new mongoose.Types.ObjectId(createdOrder.id);
    record.processedAt = new Date();
    await record.save();

    return {
      message: mapWARecordToDto(record),
      order: createdOrder,
    };
  }

  async dismissMessage(messageRecordId: string, adminUserId: string): Promise<WhatsAppMessageRecordDto> {
    const record = await WhatsAppMessageRecordModel.findById(messageRecordId);
    if (!record) throw new NotFoundError('WhatsApp message record not found.');

    record.status = WhatsAppMessageStatus.DISMISSED;
    record.handledBy = new mongoose.Types.ObjectId(adminUserId);
    record.processedAt = new Date();
    await record.save();

    return mapWARecordToDto(record);
  }
}

export const whatsAppService = new WhatsAppService();
