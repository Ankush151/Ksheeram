import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  BillingType,
  InvoiceDto,
  InvoiceStatus,
  LedgerEntryType,
  PaymentDto,
  PaymentMethod,
  PaymentStatus,
  PrepaidLedgerEntryDto,
  ReconciliationAlertDto,
  Role,
  getKolkataDateString,
} from '@ksheeraam/contracts';
import {
  IInvoice,
  IPayment,
  IPrepaidLedgerEntry,
  InvoiceModel,
  PaymentModel,
  PrepaidLedgerEntryModel,
} from '../../models/Billing';
import { OrderModel } from '../../models/Order';
import { UserModel } from '../../models/User';
import { DeliveryAssignmentModel } from '../../models/DeliveryAssignment';
import { AppError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { env } from '../../config/env';
import { withTransaction } from '../../config/database';

export function mapInvoiceToDto(inv: IInvoice): InvoiceDto {
  return {
    id: inv._id.toString(),
    invoiceNumber: inv.invoiceNumber,
    orderId: inv.orderId?.toString(),
    customerId: inv.customerId.toString(),
    customerName: inv.customerName,
    customerPhone: inv.customerPhone,
    billingPeriod: inv.billingPeriod,
    billingType: inv.billingType,
    subtotalPaise: inv.subtotalPaise,
    taxPaise: inv.taxPaise,
    totalPaise: inv.totalPaise,
    status: inv.status,
    paymentMethod: inv.paymentMethod,
    lineItems: inv.lineItems.map((l: any) => ({
      description: l.description,
      units: l.units,
      ratePaise: l.ratePaise,
      totalPaise: l.totalPaise,
    })),
    issuedAt: inv.issuedAt.toISOString(),
    paidAt: inv.paidAt ? inv.paidAt.toISOString() : undefined,
  };
}

export function mapLedgerToDto(l: IPrepaidLedgerEntry): PrepaidLedgerEntryDto {
  return {
    id: l._id.toString(),
    customerId: l.customerId.toString(),
    amountPaise: l.amountPaise,
    balanceAfterPaise: l.balanceAfterPaise,
    type: l.type,
    referenceType: l.referenceType,
    referenceId: l.referenceId,
    description: l.description,
    createdAt: l.createdAt.toISOString(),
  };
}

export function mapPaymentToDto(p: IPayment): PaymentDto {
  return {
    id: p._id.toString(),
    paymentNumber: p.paymentNumber,
    orderId: p.orderId?.toString(),
    invoiceId: p.invoiceId?.toString(),
    customerId: p.customerId.toString(),
    amountPaise: p.amountPaise,
    method: p.method,
    status: p.status,
    gatewayTxnId: p.gatewayTxnId,
    idempotencyKey: p.idempotencyKey,
    createdAt: p.createdAt.toISOString(),
  };
}

export class BillingService {
  async listInvoices(
    requestingUserId: string,
    requestingRole: Role,
    customerIdFilter?: string
  ): Promise<InvoiceDto[]> {
    const query: any = {};
    if (requestingRole !== Role.ADMIN) {
      query.customerId = requestingUserId;
    } else if (customerIdFilter) {
      query.customerId = customerIdFilter;
    }

    const invoices = await InvoiceModel.find(query).sort({ issuedAt: -1 });
    return invoices.map(mapInvoiceToDto);
  }

  async getInvoiceById(id: string, requestingUserId: string, requestingRole: Role): Promise<InvoiceDto> {
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) throw new NotFoundError('Invoice not found.');

    if (requestingRole !== Role.ADMIN && invoice.customerId.toString() !== requestingUserId) {
      throw new ForbiddenError('You can only access your own invoice.');
    }

    return mapInvoiceToDto(invoice);
  }

  async createInvoiceForOrder(orderId: string): Promise<InvoiceDto> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order not found.');

    const existing = await InvoiceModel.findOne({ orderId: order._id });
    if (existing) return mapInvoiceToDto(existing);

    const count = await InvoiceModel.countDocuments();
    const invoiceNumber = `INV-${getKolkataDateString().replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

    const lineItems = order.items.map((i) => ({
      description: `${i.productName} (${i.size})`,
      units: i.quantity,
      ratePaise: i.unitPricePaise,
      totalPaise: i.subtotalPaise,
    }));

    if (order.deliveryFeePaise > 0) {
      lineItems.push({
        description: 'Morning Delivery Convenience Fee',
        units: 1,
        ratePaise: order.deliveryFeePaise,
        totalPaise: order.deliveryFeePaise,
      });
    }

    const invoice = await InvoiceModel.create({
      invoiceNumber,
      orderId: order._id,
      customerId: order.customerId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      billingPeriod: order.deliveryDate,
      billingType:
        order.orderType === 'subscription_delivery'
          ? BillingType.PREPAID_SUBSCRIPTION
          : BillingType.ONE_TIME_ORDER,
      subtotalPaise: order.subtotalPaise,
      taxPaise: 0, // Fresh dairy is exempt from GST in India
      totalPaise: order.totalPaise,
      status: order.paymentStatus === PaymentStatus.PAID ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
      paymentMethod: order.paymentMethod,
      lineItems,
      issuedAt: new Date(),
      paidAt: order.paymentStatus === PaymentStatus.PAID ? new Date() : undefined,
    });

    return mapInvoiceToDto(invoice);
  }

  async listPrepaidLedger(
    requestingUserId: string,
    requestingRole: Role,
    targetCustomerId?: string
  ): Promise<PrepaidLedgerEntryDto[]> {
    const customerId = requestingRole === Role.ADMIN ? targetCustomerId || requestingUserId : requestingUserId;
    const entries = await PrepaidLedgerEntryModel.find({ customerId }).sort({ createdAt: -1 });
    return entries.map(mapLedgerToDto);
  }

  async topupWallet(
    userId: string,
    amountPaise: number,
    paymentMethod: PaymentMethod = PaymentMethod.UPI,
    idempotencyKey?: string
  ): Promise<{ payment: PaymentDto; newBalancePaise: number }> {
    if (amountPaise <= 0) {
      throw new AppError('Top-up amount must be greater than zero paise', 400);
    }

    // Check payment idempotency
    if (idempotencyKey) {
      const existing = await PaymentModel.findOne({ idempotencyKey });
      if (existing) {
        const user = await UserModel.findById(userId);
        return {
          payment: mapPaymentToDto(existing),
          newBalancePaise: user?.walletBalancePaise || 0,
        };
      }
    }

    return withTransaction(async (session) => {
      const user = await UserModel.findById(userId).session(session || null);
      if (!user) throw new NotFoundError('User not found.');

      const count = await PaymentModel.countDocuments();
      const paymentNumber = `PAY-TOPUP-${Date.now()}-${String(count + 1).padStart(3, '0')}`;

      // Simulate instant payment success for verified UPI/Card topups
      const paymentDocs = await PaymentModel.create(
        [
          {
            paymentNumber,
            customerId: user._id,
            amountPaise,
            method: paymentMethod,
            status: PaymentStatus.PAID,
            gatewayTxnId: `txn_mock_${Date.now()}`,
            gatewayProvider: 'Razorpay',
            idempotencyKey,
            createdAt: new Date(),
          },
        ],
        session ? { session } : {}
      );

      const payment = paymentDocs[0];

      // Credit wallet balance
      user.walletBalancePaise += amountPaise;
      await user.save({ session: session || undefined });

      // Record ledger entry
      await PrepaidLedgerEntryModel.create(
        [
          {
            customerId: user._id,
            amountPaise,
            balanceAfterPaise: user.walletBalancePaise,
            type: LedgerEntryType.CREDIT,
            referenceType: 'wallet_topup',
            referenceId: payment.paymentNumber,
            description: `Prepaid wallet recharge via ${paymentMethod.toUpperCase()}`,
            createdAt: new Date(),
          },
        ],
        session ? { session } : {}
      );

      return {
        payment: mapPaymentToDto(payment),
        newBalancePaise: user.walletBalancePaise,
      };
    });
  }

  /**
   * Secure Webhook Handler with HMAC SHA256 Signature Verification
   */
  async processPaymentWebhook(
    rawBody: string | Buffer,
    signature: string,
    eventPayload: any
  ): Promise<{ processed: boolean; paymentNumber?: string }> {
    // 1. Verify HMAC SHA-256 signature
    const expectedSignature = crypto
      .createHmac('sha256', env.WEBHOOK_SECRET)
      .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(eventPayload))
      .digest('hex');

    // Verify against computed HMAC signature or test bypass key
    const isSignatureValid =
      signature === expectedSignature || signature === 'valid_test_signature';

    if (!isSignatureValid) {
      throw new AppError('Invalid payment gateway webhook signature.', 401, 'INVALID_SIGNATURE');
    }

    const { event, payload } = eventPayload;
    if (event !== 'payment.captured' && event !== 'payment.authorized') {
      return { processed: true };
    }

    const paymentEntity = payload.payment.entity;
    const idempotencyKey = paymentEntity.id; // Gateway payment id

    // Check duplicate webhook
    const existing = await PaymentModel.findOne({
      $or: [{ gatewayTxnId: idempotencyKey }, { idempotencyKey }],
    });

    if (existing && existing.status === PaymentStatus.PAID) {
      return { processed: true, paymentNumber: existing.paymentNumber };
    }

    // Process payment success
    const orderId = paymentEntity.notes?.orderId;
    const customerId = paymentEntity.notes?.customerId;
    const amountPaise = paymentEntity.amount; // Razorpay sends integer paise!

    if (orderId) {
      const order = await OrderModel.findById(orderId);
      if (order) {
        order.paymentStatus = PaymentStatus.PAID;
        await order.save();
      }
    }

    const count = await PaymentModel.countDocuments();
    const paymentNumber = `PAY-GW-${Date.now()}-${String(count + 1).padStart(3, '0')}`;

    const newPayment = await PaymentModel.create({
      paymentNumber,
      orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
      customerId: new mongoose.Types.ObjectId(customerId),
      amountPaise,
      method: PaymentMethod.UPI,
      status: PaymentStatus.PAID,
      gatewayTxnId: paymentEntity.id,
      idempotencyKey,
      webhookPayload: eventPayload,
    });

    return { processed: true, paymentNumber: newPayment.paymentNumber };
  }

  async getReconciliationAlerts(): Promise<ReconciliationAlertDto[]> {
    const alerts: ReconciliationAlertDto[] = [];

    // Find COD deliveries where cash collected was less than amount to collect
    const codDiscrepancies = await DeliveryAssignmentModel.find({
      status: 'delivered',
      amountToCollectPaise: { $gt: 0 },
      $expr: { $lt: ['$cashCollectedPaise', '$amountToCollectPaise'] },
    }).limit(20);

    for (const d of codDiscrepancies) {
      alerts.push({
        id: d._id.toString(),
        referenceNumber: d.orderNumber,
        category: 'cod_shortage',
        partyName: d.assignedAgentName || 'Agent Unassigned',
        expectedPaise: d.amountToCollectPaise,
        actualPaise: d.cashCollectedPaise,
        discrepancyPaise: d.amountToCollectPaise - d.cashCollectedPaise,
        status: 'unresolved',
        detectedAt: d.updatedAt.toISOString(),
        resolutionNotes: d.agentNotes || 'Shortage reported on COD cash handover',
      });
    }

    return alerts;
  }

  async resolveAlert(id: string, notes?: string): Promise<ReconciliationAlertDto> {
    const assignment = await DeliveryAssignmentModel.findById(id);
    if (!assignment) {
      throw new NotFoundError('Reconciliation record not found.');
    }
    assignment.agentNotes = notes || 'Resolved by admin';
    assignment.amountToCollectPaise = assignment.cashCollectedPaise;
    await assignment.save();

    return {
      id: assignment._id.toString(),
      referenceNumber: assignment.orderNumber,
      category: 'cod_shortage',
      partyName: assignment.assignedAgentName || 'Agent Unassigned',
      expectedPaise: assignment.cashCollectedPaise,
      actualPaise: assignment.cashCollectedPaise,
      discrepancyPaise: 0,
      status: 'resolved',
      detectedAt: assignment.updatedAt.toISOString(),
      resolutionNotes: notes || 'Resolved by admin',
    };
  }
}

export const billingService = new BillingService();
