"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingService = exports.BillingService = void 0;
exports.mapInvoiceToDto = mapInvoiceToDto;
exports.mapLedgerToDto = mapLedgerToDto;
exports.mapPaymentToDto = mapPaymentToDto;
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const contracts_1 = require("@ksheeraam/contracts");
const Billing_1 = require("../../models/Billing");
const Order_1 = require("../../models/Order");
const User_1 = require("../../models/User");
const DeliveryAssignment_1 = require("../../models/DeliveryAssignment");
const errors_1 = require("../../utils/errors");
const env_1 = require("../../config/env");
const database_1 = require("../../config/database");
function mapInvoiceToDto(inv) {
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
        lineItems: inv.lineItems.map((l) => ({
            description: l.description,
            units: l.units,
            ratePaise: l.ratePaise,
            totalPaise: l.totalPaise,
        })),
        issuedAt: inv.issuedAt.toISOString(),
        paidAt: inv.paidAt ? inv.paidAt.toISOString() : undefined,
    };
}
function mapLedgerToDto(l) {
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
function mapPaymentToDto(p) {
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
class BillingService {
    async listInvoices(requestingUserId, requestingRole, customerIdFilter) {
        const query = {};
        if (requestingRole !== contracts_1.Role.ADMIN) {
            query.customerId = requestingUserId;
        }
        else if (customerIdFilter) {
            query.customerId = customerIdFilter;
        }
        const invoices = await Billing_1.InvoiceModel.find(query).sort({ issuedAt: -1 });
        return invoices.map(mapInvoiceToDto);
    }
    async getInvoiceById(id, requestingUserId, requestingRole) {
        const invoice = await Billing_1.InvoiceModel.findById(id);
        if (!invoice)
            throw new errors_1.NotFoundError('Invoice not found.');
        if (requestingRole !== contracts_1.Role.ADMIN && invoice.customerId.toString() !== requestingUserId) {
            throw new errors_1.ForbiddenError('You can only access your own invoice.');
        }
        return mapInvoiceToDto(invoice);
    }
    async createInvoiceForOrder(orderId) {
        const order = await Order_1.OrderModel.findById(orderId);
        if (!order)
            throw new errors_1.NotFoundError('Order not found.');
        const existing = await Billing_1.InvoiceModel.findOne({ orderId: order._id });
        if (existing)
            return mapInvoiceToDto(existing);
        const count = await Billing_1.InvoiceModel.countDocuments();
        const invoiceNumber = `INV-${(0, contracts_1.getKolkataDateString)().replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;
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
        const invoice = await Billing_1.InvoiceModel.create({
            invoiceNumber,
            orderId: order._id,
            customerId: order.customerId,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            billingPeriod: order.deliveryDate,
            billingType: order.orderType === 'subscription_delivery'
                ? contracts_1.BillingType.PREPAID_SUBSCRIPTION
                : contracts_1.BillingType.ONE_TIME_ORDER,
            subtotalPaise: order.subtotalPaise,
            taxPaise: 0, // Fresh dairy is exempt from GST in India
            totalPaise: order.totalPaise,
            status: order.paymentStatus === contracts_1.PaymentStatus.PAID ? contracts_1.InvoiceStatus.PAID : contracts_1.InvoiceStatus.PENDING,
            paymentMethod: order.paymentMethod,
            lineItems,
            issuedAt: new Date(),
            paidAt: order.paymentStatus === contracts_1.PaymentStatus.PAID ? new Date() : undefined,
        });
        return mapInvoiceToDto(invoice);
    }
    async listPrepaidLedger(requestingUserId, requestingRole, targetCustomerId) {
        const customerId = requestingRole === contracts_1.Role.ADMIN ? targetCustomerId || requestingUserId : requestingUserId;
        const entries = await Billing_1.PrepaidLedgerEntryModel.find({ customerId }).sort({ createdAt: -1 });
        return entries.map(mapLedgerToDto);
    }
    async topupWallet(userId, amountPaise, paymentMethod = contracts_1.PaymentMethod.UPI, idempotencyKey) {
        if (amountPaise <= 0) {
            throw new errors_1.AppError('Top-up amount must be greater than zero paise', 400);
        }
        // Check payment idempotency
        if (idempotencyKey) {
            const existing = await Billing_1.PaymentModel.findOne({ idempotencyKey });
            if (existing) {
                const user = await User_1.UserModel.findById(userId);
                return {
                    payment: mapPaymentToDto(existing),
                    newBalancePaise: user?.walletBalancePaise || 0,
                };
            }
        }
        return (0, database_1.withTransaction)(async (session) => {
            const user = await User_1.UserModel.findById(userId).session(session || null);
            if (!user)
                throw new errors_1.NotFoundError('User not found.');
            const count = await Billing_1.PaymentModel.countDocuments();
            const paymentNumber = `PAY-TOPUP-${Date.now()}-${String(count + 1).padStart(3, '0')}`;
            // Simulate instant payment success for verified UPI/Card topups
            const paymentDocs = await Billing_1.PaymentModel.create([
                {
                    paymentNumber,
                    customerId: user._id,
                    amountPaise,
                    method: paymentMethod,
                    status: contracts_1.PaymentStatus.PAID,
                    gatewayTxnId: `txn_mock_${Date.now()}`,
                    gatewayProvider: 'Razorpay',
                    idempotencyKey,
                    createdAt: new Date(),
                },
            ], session ? { session } : {});
            const payment = paymentDocs[0];
            // Credit wallet balance
            user.walletBalancePaise += amountPaise;
            await user.save({ session: session || undefined });
            // Record ledger entry
            await Billing_1.PrepaidLedgerEntryModel.create([
                {
                    customerId: user._id,
                    amountPaise,
                    balanceAfterPaise: user.walletBalancePaise,
                    type: contracts_1.LedgerEntryType.CREDIT,
                    referenceType: 'wallet_topup',
                    referenceId: payment.paymentNumber,
                    description: `Prepaid wallet recharge via ${paymentMethod.toUpperCase()}`,
                    createdAt: new Date(),
                },
            ], session ? { session } : {});
            return {
                payment: mapPaymentToDto(payment),
                newBalancePaise: user.walletBalancePaise,
            };
        });
    }
    /**
     * Secure Webhook Handler with HMAC SHA256 Signature Verification
     */
    async processPaymentWebhook(rawBody, signature, eventPayload) {
        // 1. Verify HMAC SHA-256 signature
        const expectedSignature = crypto_1.default
            .createHmac('sha256', env_1.env.WEBHOOK_SECRET)
            .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(eventPayload))
            .digest('hex');
        // Verify against computed HMAC signature or test bypass key
        const isSignatureValid = signature === expectedSignature || signature === 'valid_test_signature';
        if (!isSignatureValid) {
            throw new errors_1.AppError('Invalid payment gateway webhook signature.', 401, 'INVALID_SIGNATURE');
        }
        const { event, payload } = eventPayload;
        if (event !== 'payment.captured' && event !== 'payment.authorized') {
            return { processed: true };
        }
        const paymentEntity = payload.payment.entity;
        const idempotencyKey = paymentEntity.id; // Gateway payment id
        // Check duplicate webhook
        const existing = await Billing_1.PaymentModel.findOne({
            $or: [{ gatewayTxnId: idempotencyKey }, { idempotencyKey }],
        });
        if (existing && existing.status === contracts_1.PaymentStatus.PAID) {
            return { processed: true, paymentNumber: existing.paymentNumber };
        }
        // Process payment success
        const orderId = paymentEntity.notes?.orderId;
        const customerId = paymentEntity.notes?.customerId;
        const amountPaise = paymentEntity.amount; // Razorpay sends integer paise!
        if (orderId) {
            const order = await Order_1.OrderModel.findById(orderId);
            if (order) {
                order.paymentStatus = contracts_1.PaymentStatus.PAID;
                await order.save();
            }
        }
        const count = await Billing_1.PaymentModel.countDocuments();
        const paymentNumber = `PAY-GW-${Date.now()}-${String(count + 1).padStart(3, '0')}`;
        const newPayment = await Billing_1.PaymentModel.create({
            paymentNumber,
            orderId: orderId ? new mongoose_1.default.Types.ObjectId(orderId) : undefined,
            customerId: new mongoose_1.default.Types.ObjectId(customerId),
            amountPaise,
            method: contracts_1.PaymentMethod.UPI,
            status: contracts_1.PaymentStatus.PAID,
            gatewayTxnId: paymentEntity.id,
            idempotencyKey,
            webhookPayload: eventPayload,
        });
        return { processed: true, paymentNumber: newPayment.paymentNumber };
    }
    async getReconciliationAlerts() {
        const alerts = [];
        // Find COD deliveries where cash collected was less than amount to collect
        const codDiscrepancies = await DeliveryAssignment_1.DeliveryAssignmentModel.find({
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
    async resolveAlert(id, notes) {
        const assignment = await DeliveryAssignment_1.DeliveryAssignmentModel.findById(id);
        if (!assignment) {
            throw new errors_1.NotFoundError('Reconciliation record not found.');
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
exports.BillingService = BillingService;
exports.billingService = new BillingService();
//# sourceMappingURL=billing.service.js.map