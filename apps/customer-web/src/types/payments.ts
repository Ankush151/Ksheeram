export type TransactionStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type PaymentGateway = 'razorpay' | 'phonepe' | 'paytm' | 'cashfree' | 'wallet';

export interface PaymentTransaction {
  id: string;
  transactionNumber: string;
  orderId?: string;
  orderNumber?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  method: string; // "UPI", "Credit Card", "Wallet Balance", "Net Banking"
  gateway: PaymentGateway;
  gatewayTransactionId?: string;
  description: string;
  invoiceNumber: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  subscriptionId?: string;
  issueDate: string;
  dueDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  totalAmount: number;
  status: 'paid' | 'pending' | 'cancelled';
  paymentMethod: string;
  fssaiNumber: string;
  gstin: string;
}

export interface WalletRechargePayload {
  amount: number;
  paymentMethod: 'upi' | 'card' | 'netbanking';
}
