export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  orderNumber?: string;
  customerName: string;
  customerPhone?: string;
  billingType: 'prepaid_subscription' | 'one_time_order' | 'wallet_recharge';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amount?: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded' | 'overdue';
  paymentMethod: string;
  gatewayTxnId?: string;
  issueDate?: string;
  generatedAt?: string;
  billingPeriod?: string;
  paidAt?: string;
  lineItems?: Array<{
    description: string;
    units: number;
    rate: number;
    total: number;
  }>;
}

export interface PaymentReconciliationAlert {
  id: string;
  referenceType: 'order' | 'subscription' | 'cash_collection';
  referenceNumber: string;
  customerName: string;
  customerOrAgentName?: string;
  description?: string;
  expectedAmount: number;
  recordedAmount: number;
  actualAmount?: number;
  difference: number;
  discrepancyAmount?: number;
  discrepancyType: 'cod_shortage' | 'gateway_pending' | 'chargeback' | 'duplicate_deduction' | string;
  type?: string;
  status: 'unresolved' | 'resolved';
  reportedAt?: string;
  detectedAt?: string;
  resolutionNotes?: string;
}

export interface CustomerOutstandingBalance {
  customerId: string;
  customerName: string;
  customerPhone: string;
  walletBalance: number;
  unpaidDeliveriesCount: number;
  totalDue: number;
  lastPaymentDate?: string;
}
