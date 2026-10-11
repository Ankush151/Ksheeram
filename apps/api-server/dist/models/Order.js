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
exports.OrderModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const contracts_1 = require("@ksheeraam/contracts");
const OrderItemSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose_1.Schema.Types.ObjectId },
    productName: { type: String, required: true },
    size: { type: String, enum: Object.values(contracts_1.PackageSize), required: true },
    packagingType: {
        type: String,
        enum: Object.values(contracts_1.PackagingType),
        default: contracts_1.PackagingType.GLASS_BOTTLE,
        required: true,
    },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    unitPricePaise: { type: Number, required: true, validate: Number.isInteger },
    subtotalPaise: { type: Number, required: true, validate: Number.isInteger },
}, { _id: true });
const OrderSchema = new mongoose_1.Schema({
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    orderType: {
        type: String,
        enum: Object.values(contracts_1.OrderType),
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: Object.values(contracts_1.OrderStatus),
        default: contracts_1.OrderStatus.PLACED,
        required: true,
        index: true,
    },
    stockAllocated: { type: Boolean, default: false },
    paymentStatus: {
        type: String,
        enum: Object.values(contracts_1.PaymentStatus),
        default: contracts_1.PaymentStatus.PENDING,
        required: true,
        index: true,
    },
    paymentMethod: {
        type: String,
        enum: Object.values(contracts_1.PaymentMethod),
        required: true,
        index: true,
    },
    items: [OrderItemSchema],
    addressId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Address' },
    deliveryAddress: { type: String, required: true },
    pincode: { type: String, required: true },
    deliveryDate: { type: String, required: true, index: true }, // YYYY-MM-DD
    deliverySlot: { type: String, default: 'Morning 6:00 AM - 7:30 AM' },
    subtotalPaise: { type: Number, required: true, validate: Number.isInteger },
    deliveryFeePaise: { type: Number, default: 0, validate: Number.isInteger },
    totalPaise: { type: Number, required: true, validate: Number.isInteger },
    assignedAgentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true },
    assignedAgentName: { type: String },
    deliveryInstructions: { type: String },
    failedReason: { type: String },
    subscriptionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Subscription', index: true },
    idempotencyKey: { type: String, trim: true },
}, {
    timestamps: true,
});
// Indexes
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ deliveryDate: 1, status: 1 });
OrderSchema.index({ assignedAgentId: 1, deliveryDate: 1 });
// Critical Idempotency: Only ONE order can ever be created for a subscription on a given delivery date!
OrderSchema.index({ subscriptionId: 1, deliveryDate: 1 }, {
    unique: true,
    partialFilterExpression: { subscriptionId: { $type: 'objectId' } },
});
// Idempotency key uniqueness for one-time orders
OrderSchema.index({ idempotencyKey: 1 }, {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string', $gt: '' } },
});
exports.OrderModel = mongoose_1.default.models.Order || mongoose_1.default.model('Order', OrderSchema);
//# sourceMappingURL=Order.js.map