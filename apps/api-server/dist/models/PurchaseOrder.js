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
exports.PurchaseOrderModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const contracts_1 = require("@ksheeraam/contracts");
const ProcurementItemSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    size: { type: String, enum: Object.values(contracts_1.PackageSize), required: true },
    packagingType: {
        type: String,
        enum: Object.values(contracts_1.PackagingType),
        default: contracts_1.PackagingType.GLASS_BOTTLE,
        required: true,
    },
    orderedUnits: { type: Number, required: true, validate: Number.isInteger },
    receivedUnits: { type: Number, default: 0, validate: Number.isInteger },
    rejectedUnits: { type: Number, default: 0, validate: Number.isInteger },
    unitCostPaise: { type: Number, required: true, validate: Number.isInteger },
    totalCostPaise: { type: Number, required: true, validate: Number.isInteger },
    rejectionReason: { type: String, trim: true },
}, { _id: true });
const PurchaseOrderSchema = new mongoose_1.Schema({
    poNumber: { type: String, required: true, unique: true, index: true },
    supplierId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    supplierName: { type: String, required: true },
    orderDate: { type: String, required: true, index: true },
    expectedDeliveryDate: { type: String, required: true },
    status: {
        type: String,
        enum: ['ordered', 'received', 'cancelled'],
        default: 'ordered',
        index: true,
    },
    items: [ProcurementItemSchema],
    totalUnitsOrdered: { type: Number, required: true, validate: Number.isInteger },
    totalUnitsReceived: { type: Number, default: 0, validate: Number.isInteger },
    totalUnitsRejected: { type: Number, default: 0, validate: Number.isInteger },
    totalCostPaise: { type: Number, required: true, validate: Number.isInteger },
    chillingTempVerified: { type: String, trim: true },
    qualityTesterName: { type: String, trim: true },
    notes: { type: String, trim: true },
    receivedAt: { type: Date },
}, {
    timestamps: true,
});
exports.PurchaseOrderModel = mongoose_1.default.models.PurchaseOrder || mongoose_1.default.model('PurchaseOrder', PurchaseOrderSchema);
//# sourceMappingURL=PurchaseOrder.js.map