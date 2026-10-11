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
exports.InventoryMovementModel = exports.InventoryBalanceModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const contracts_1 = require("@ksheeraam/contracts");
const InventoryBalanceSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    size: { type: String, enum: Object.values(contracts_1.PackageSize), required: true },
    packagingType: {
        type: String,
        enum: Object.values(contracts_1.PackagingType),
        default: contracts_1.PackagingType.GLASS_BOTTLE,
        required: true,
    },
    physicalUnits: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        validate: Number.isInteger,
    },
    reservedUnits: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        validate: Number.isInteger,
    },
    damagedUnits: {
        type: Number,
        default: 0,
        min: 0,
        validate: Number.isInteger,
    },
    reorderLevel: {
        type: Number,
        default: 20,
        validate: Number.isInteger,
    },
    lastUpdated: { type: Date, default: Date.now },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Virtual property for availableUnits = physicalUnits - reservedUnits
InventoryBalanceSchema.virtual('availableUnits').get(function () {
    return Math.max(0, this.physicalUnits - this.reservedUnits);
});
// Compound unique index ensuring only 1 record exists per (productId, size, packagingType)
InventoryBalanceSchema.index({ productId: 1, size: 1, packagingType: 1 }, { unique: true });
const InventoryMovementSchema = new mongoose_1.Schema({
    inventoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'InventoryBalance', required: true, index: true },
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    size: { type: String, enum: Object.values(contracts_1.PackageSize), required: true },
    packagingType: {
        type: String,
        enum: Object.values(contracts_1.PackagingType),
        default: contracts_1.PackagingType.GLASS_BOTTLE,
        required: true,
    },
    movementType: {
        type: String,
        enum: Object.values(contracts_1.StockMovementType),
        required: true,
        index: true,
    },
    deltaUnits: { type: Number, required: true, validate: Number.isInteger },
    balanceAfter: { type: Number, required: true, validate: Number.isInteger },
    referenceType: { type: String, trim: true },
    referenceId: { type: String, trim: true },
    reason: { type: String, required: true, trim: true },
    performedBy: { type: String, default: 'SYSTEM', trim: true },
    timestamp: { type: Date, default: Date.now, index: true },
}, {
    timestamps: true,
});
exports.InventoryBalanceModel = mongoose_1.default.models.InventoryBalance ||
    mongoose_1.default.model('InventoryBalance', InventoryBalanceSchema);
exports.InventoryMovementModel = mongoose_1.default.models.InventoryMovement ||
    mongoose_1.default.model('InventoryMovement', InventoryMovementSchema);
//# sourceMappingURL=Inventory.js.map