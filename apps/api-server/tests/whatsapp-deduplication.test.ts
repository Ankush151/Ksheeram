import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { Role } from '@ksheeraam/contracts';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { UserModel } from '../src/models/User';
import { WhatsAppMessageRecordModel } from '../src/models/WhatsApp';
import { whatsAppService } from '../src/modules/whatsapp/whatsapp.service';

describe('WhatsApp Integration & Message Deduplication', () => {
  let customerId: mongoose.Types.ObjectId;
  const testPhone = '9876599999';

  beforeAll(async () => {
    await connectDatabase();
    const customer = await UserModel.create({
      name: 'WA Tester',
      phone: testPhone,
      role: Role.CUSTOMER,
      whatsappOptOut: false,
    });
    customerId = customer._id as mongoose.Types.ObjectId;
  });

  afterAll(async () => {
    await UserModel.findByIdAndDelete(customerId);
    await WhatsAppMessageRecordModel.deleteMany({ senderPhone: { $regex: testPhone } });
    await disconnectDatabase();
  });

  it('deduplicates incoming WhatsApp messages by provider messageId', async () => {
    const uniqueMessageId = `wamid.TEST_${Date.now()}`;
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '918000000000',
                  phone_number_id: '10892049812903',
                },
                contacts: [{ profile: { name: 'WA Tester' }, wa_id: `91${testPhone}` }],
                messages: [
                  {
                    from: `91${testPhone}`,
                    id: uniqueMessageId,
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                    text: { body: 'I want 2 litres of A2 Cow Milk tomorrow' },
                    type: 'text',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    // First arrival
    const result1 = await whatsAppService.processInboundWebhook(webhookPayload);
    expect(result1.processed).toBe(1);
    expect(result1.duplicates).toBe(0);

    // Verify record in DB
    const record = await WhatsAppMessageRecordModel.findOne({ messageId: uniqueMessageId });
    expect(record).toBeTruthy();
    expect(record?.senderPhone).toBe(`91${testPhone}`);
    expect(record?.detectedIntent).toBe('order_request');

    // Second arrival of same message (Meta webhook retry)
    const result2 = await whatsAppService.processInboundWebhook(webhookPayload);
    expect(result2.processed).toBe(0);
    expect(result2.duplicates).toBe(1);

    // Records count must strictly be 1
    const totalRecords = await WhatsAppMessageRecordModel.countDocuments({ messageId: uniqueMessageId });
    expect(totalRecords).toBe(1);
  });

  it('processes STOP opt-out keyword and updates user whatsappOptOut flag', async () => {
    const stopMsgId = `wamid.STOP_${Date.now()}`;
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '918000000000',
                  phone_number_id: '10892049812903',
                },
                messages: [
                  {
                    from: `91${testPhone}`,
                    id: stopMsgId,
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                    text: { body: 'STOP' },
                    type: 'text',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    await whatsAppService.processInboundWebhook(webhookPayload);

    const user = await UserModel.findById(customerId);
    expect(user?.whatsappOptOut).toBe(true);
  });
});
