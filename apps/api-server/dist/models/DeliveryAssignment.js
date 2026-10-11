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
exports.DeliveryAssignmentModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const contracts_1 = require("@ksheeraam/contracts");
const DeliveryEventSchema = new mongoose_1.Schema({
    status: {
        type: String,
        enum: Object.values(contracts_1.DeliveryStatus),
        required: true,
    },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String },
    location: {
        lat: { type: Number },
        lng: { type: Number },
    },
}, { _id: true });
const DeliveryAssignmentSchema = new mongoose_1.Schema({
    orderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, index: true },
    orderNumber: { type: String, required: true },
    deliveryDate: { type: String, required: true, index: true },
    assignedAgentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true },
    assignedAgentName: { type: String },
    status: {
        type: String,
        enum: Object.values(contracts_1.DeliveryStatus),
        default: contracts_1.DeliveryStatus.ASSIGNED,
        required: true,
        index: true,
    },
    amountToCollectPaise: { type: Number, default: 0, validate: Number.isInteger },
    cashCollectedPaise: { type: Number, default: 0, validate: Number.isInteger },
    failedReason: {
        type: String,
        enum: Object.values(contracts_1.DeliveryFailureReason),
    },
    agentNotes: { type: String },
    deliveredAt: { type: Date },
    events: [DeliveryEventSchema],
}, {
    timestamps: true,
});
DeliveryAssignmentSchema.index({ assignedAgentId: 1, deliveryDate: 1, status: 1 });
DeliveryAssignmentSchema.index({ deliveryDate: 1, status: 1 });
exports.DeliveryAssignmentModel = mongoose_1.default.models.DeliveryAssignment ||
    mongoose_1.default.model('DeliveryAssignment', DeliveryAssignmentSchema);
//# sourceMappingURL=DeliveryAssignment.js.map