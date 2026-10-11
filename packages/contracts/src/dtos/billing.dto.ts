import { BillingType, InvoiceStatus, LedgerEntryType, PaymentMethod, PaymentStatus } from '../enums';

export interface InvoiceLineItemDto {
  description: string;
  units: number;
  ratePaise: number;
  totalPaise: number;
}

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  billingPeriod: string;
  billingType: BillingType;
  subtotalPaise: number;
  taxPaise: number;
  totalPaise: number;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  lineItems: InvoiceLineItemDto[];
  issuedAt: string;
  paidAt?: string;
}

export interface PaymentDto {
  id: string;
  paymentNumber: string;
  orderId?: string;
  invoiceId?: string;
  customerId: string;
  amountPaise: number;
  method: PaymentMethod;
  status: PaymentStatus;
  gatewayTxnId?: string;
  idempotencyKey?: string;
  createdAt: string;
}

export interface PrepaidLedgerEntryDto {
  id: string;
  customerId: string;
  amountPaise: number;
  balanceAfterPaise: number;
  type: LedgerEntryType;
  referenceType: 'subscription_charge' | 'wallet_topup' | 'order_charge' | 'refund' | 'admin_adjustment';
  referenceId?: string;
  description: string;
  createdAt: string;
}

export interface ReconciliationAlertDto {
  id: string;
  referenceNumber: string;
  category: 'cod_shortage' | 'gateway_pending' | 'chargeback' | 'mismatch';
  partyName: string;
  expectedPaise: number;
  actualPaise: number;
  discrepancyPaise: number;
  status: 'unresolved' | 'resolved';
  detectedAt: string;
  resolutionNotes?: string;
}
