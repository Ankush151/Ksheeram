"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepaidLedgerEntryModel = exports.PaymentModel = exports.InvoiceModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const contracts_1 = require("@ksheeraam/contracts");
const InvoiceLineItemSchema = new mongoose_1.Schema({
    description: { type: String, required: true },
    units: { type: Number, required: true, validate: Number.isInteger },
    ratePaise: { type: Number, required: true, validate: Number.isInteger },
    totalPaise: { type: Number, required: true, validate: Number.isInteger },
}, { _id: true });
const InvoiceSchema = new mongoose_1.Schema({
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Order', index: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    billingPeriod: { type: String, required: true },
    billingType: {
        type: String,
        enum: Object.values(contracts_1.BillingType),
        required: true,
    },
    subtotalPaise: { type: Number, required: true, validate: Number.isInteger },
    taxPaise: { type: Number, default: 0, validate: Number.isInteger },
    totalPaise: { type: Number, required: true, validate: Number.isInteger },
    status: {
        type: String,
        enum: Object.values(contracts_1.InvoiceStatus),
        default: contracts_1.InvoiceStatus.PENDING,
        required: true,
        index: true,
    },
    paymentMethod: {
        type: String,
        enum: Object.values(contracts_1.PaymentMethod),
        required: true,
    },
    lineItems: [InvoiceLineItemSchema],
    issuedAt: { type: Date, default: Date.now },
    paidAt: { type: Date },
}, {
    timestamps: true,
});
exports.InvoiceModel = mongoose_1.default.models.Invoice || mongoose_1.default.model('Invoice', InvoiceSchema);
const PaymentSchema = new mongoose_1.Schema({
    paymentNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Order', index: true },
    invoiceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Invoice', index: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amountPaise: { type: Number, required: true, validate: Number.isInteger },
    method: {
        type: String,
        enum: Object.values(contracts_1.PaymentMethod),
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: Object.values(contracts_1.PaymentStatus),
        default: contracts_1.PaymentStatus.PENDING,
        required: true,
        index: true,
    },
    gatewayTxnId: { type: String, index: true },
    gatewayProvider: { type: String, default: 'Razorpay' },
    idempotencyKey: { type: String, trim: true },
    webhookPayload: { type: mongoose_1.Schema.Types.Mixed },
}, {
    timestamps: true,
});
PaymentSchema.index({ idempotencyKey: 1 }, {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string', $gt: '' } },
});
exports.PaymentModel = mongoose_1.default.models.Payment || mongoose_1.default.model('Payment', PaymentSchema);
const PrepaidLedgerEntrySchema = new mongoose_1.Schema({
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amountPaise: { type: Number, required: true, validate: Number.isInteger },
    balanceAfterPaise: { type: Number, required: true, validate: Number.isInteger },
    type: {
        type: String,
        enum: Object.values(contracts_1.LedgerEntryType),
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
}, {
    timestamps: false,
});
PrepaidLedgerEntrySchema.index({ customerId: 1, createdAt: -1 });
exports.PrepaidLedgerEntryModel = mongoose_1.default.models.PrepaidLedgerEntry ||
    mongoose_1.default.model('PrepaidLedgerEntry', PrepaidLedgerEntrySchema);
//# sourceMappingURL=Billing.js.map