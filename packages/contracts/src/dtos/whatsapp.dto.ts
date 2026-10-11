import { WhatsAppMessageStatus } from '../enums';

export interface WhatsAppInboundWebhookDto {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string; // WhatsApp provider message ID
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface WhatsAppMessageRecordDto {
  id: string;
  messageId: string; // WhatsApp provider message ID (unique)
  senderPhone: string;
  customerName?: string;
  customerId?: string;
  rawMessage: string;
  status: WhatsAppMessageStatus;
  handledBy?: string;
  convertedOrderId?: string;
  receivedAt: string;
}
