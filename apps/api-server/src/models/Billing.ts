import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  BillingType,
  InvoiceStatus,
  LedgerEntryType,
  PaymentMethod,
  PaymentStatus,
} from '@ksheeraam/contracts';

// ----------------------------------------------------
// 1. INVOICE MODEL
// ----------------------------------------------------
export interface IInvoiceLineItem {
  description: string;
  units: number;
  ratePaise: number;
  totalPaise: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  orderId?: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  billingPeriod: string;
  billingType: BillingType;
  subtotalPaise: number;
  taxPaise: number;
  totalPaise: number;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  lineItems: IInvoiceLineItem[];
  issuedAt: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceLineItemSchema = new Schema<IInvoiceLineItem>(
  {
    description: { type: String, required: true },
    units: { type: Number, required: true, validate: Number.isInteger },
    ratePaise: { type: Number, required: true, validate: Number.isInteger },
    totalPaise: { type: Number, required: true, validate: Number.isInteger },
  },
  { _id: true }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    billingPeriod: { type: String, required: true },
    billingType: {
      type: String,
      enum: Object.values(BillingType),
      required: true,
    },
    subtotalPaise: { type: Number, required: true, validate: Number.isInteger },
    taxPaise: { type: Number, default: 0, validate: Number.isInteger },
    totalPaise: { type: Number, required: true, validate: Number.isInteger },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.PENDING,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    lineItems: [InvoiceLineItemSchema],
    issuedAt: { type: Date, default: Date.now },
    paidAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const InvoiceModel: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);

// ----------------------------------------------------
// 2. PAYMENT MODEL
// ----------------------------------------------------
export interface IPayment extends Document {
  paymentNumber: string;
  orderId?: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  amountPaise: number;
  method: PaymentMethod;
  status: PaymentStatus;
  gatewayTxnId?: string;
  gatewayProvider?: string;
  idempotencyKey?: string;
  webhookPayload?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amountPaise: { type: Number, required: true, validate: Number.isInteger },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      required: true,
      index: true,
    },
    gatewayTxnId: { type: String, index: true },
    gatewayProvider: { type: String, default: 'Razorpay' },
    idempotencyKey: { type: String, trim: true },
    webhookPayload: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string', $gt: '' } },
  }
);

export const PaymentModel: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

// ----------------------------------------------------
// 3. PREPAID LEDGER ENTRY MODEL
// ----------------------------------------------------
export interface IPrepaidLedgerEntry extends Document {
  customerId: mongoose.Types.ObjectId;
  amountPaise: number;
  balanceAfterPaise: number;
  type: LedgerEntryType;
  referenceType: 'subscription_charge' | 'wallet_topup' | 'order_charge' | 'refund' | 'admin_adjustment';
  referenceId?: string;
  description: string;
  createdAt: Date;
}

const PrepaidLedgerEntrySchema = new Schema<IPrepaidLedgerEntry>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amountPaise: { type: Number, required: true, validate: Number.isInteger },
    balanceAfterPaise: { type: Number, required: true, validate: Number.isInteger },
    type: {
      type: String,
      enum: Object.values(LedgerEntryType),
      required: true,
      index: true,
    },
    referenceType: {
      type: String,
      enum: ['subscription_charge', 'wallet_topup', 'order_charge', 'refund', 'admin_adjustment'],
      required: true,
    },
    referenceId: { type: String },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

PrepaidLedgerEntrySchema.index({ customerId: 1, createdAt: -1 });

export const PrepaidLedgerEntryModel: Model<IPrepaidLedgerEntry> =
  mongoose.models.PrepaidLedgerEntry ||
  mongoose.model<IPrepaidLedgerEntry>('PrepaidLedgerEntry', PrepaidLedgerEntrySchema);
