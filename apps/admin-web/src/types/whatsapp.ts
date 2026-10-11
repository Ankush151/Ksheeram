export interface WhatsAppOrderRequest {
  id: string;
  phone: string;
  customerName?: string;
  isExistingCustomer: boolean;
  message: string;
  requestedProduct?: string;
  requestedQuantity?: number;
  requestedSchedule?: string;
  address?: string;
  status: 'new' | 'in_progress' | 'converted' | 'dismissed';
  receivedAt: string;
  handledBy?: string;
}
