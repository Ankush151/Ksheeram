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
exports.SubscriptionModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const contracts_1 = require("@ksheeraam/contracts");
const SubscriptionItemSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose_1.Schema.Types.ObjectId },
    productName: { type: String, required: true },
    size: { type: String, enum: Object.values(contracts_1.PackageSize), required: true },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    unitPricePaise: { type: Number, required: true, validate: Number.isInteger },
}, { _id: true });
const SubscriptionSchema = new mongoose_1.Schema({
    subscriptionNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    status: {
        type: String,
        enum: Object.values(contracts_1.SubscriptionStatus),
        default: contracts_1.SubscriptionStatus.ACTIVE,
        required: true,
        index: true,
    },
    frequency: {
        type: String,
        enum: Object.values(contracts_1.SubscriptionFrequency),
        required: true,
        index: true,
    },
    customDays: [{ type: Number, min: 0, max: 6 }],
    items: [SubscriptionItemSchema],
    addressId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Address', required: true },
    deliveryAddress: { type: String, required: true },
    pincode: { type: String, required: true },
    startDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String }, // YYYY-MM-DD
    nextDeliveryDate: { type: String, required: true, index: true }, // YYYY-MM-DD
    pauseStartDate: { type: String },
    pauseEndDate: { type: String },
    deliverySlot: { type: String, default: 'Morning 6:00 AM - 7:30 AM' },
}, {
    timestamps: true,
});
// Compound index for querying active subscriptions eligible for generation
SubscriptionSchema.index({ status: 1, nextDeliveryDate: 1 });
exports.SubscriptionModel = mongoose_1.default.models.Subscription ||
    mongoose_1.default.model('Subscription', SubscriptionSchema);
//# sourceMappingURL=Subscription.js.map