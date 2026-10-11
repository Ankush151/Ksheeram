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
exports.ProductModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const contracts_1 = require("@ksheeraam/contracts");
const ProductVariantSchema = new mongoose_1.Schema({
    size: {
        type: String,
        enum: Object.values(contracts_1.PackageSize),
        required: true,
    },
    packagingType: {
        type: String,
        enum: Object.values(contracts_1.PackagingType),
        default: contracts_1.PackagingType.GLASS_BOTTLE,
        required: true,
    },
    pricePaise: {
        type: Number,
        required: true,
        validate: {
            validator: Number.isInteger,
            message: 'pricePaise must be an integer paise amount',
        },
    },
    mrpPaise: {
        type: Number,
        required: true,
        validate: {
            validator: Number.isInteger,
            message: 'mrpPaise must be an integer paise amount',
        },
    },
    inStock: { type: Boolean, default: true },
    saleableUnits: { type: Number, default: 100, validate: Number.isInteger },
}, { _id: true });
const ProductSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, trim: true },
    category: {
        type: String,
        enum: Object.values(contracts_1.MilkCategory),
        required: true,
        index: true,
    },
    fatContent: { type: String, required: true, trim: true },
    snfContent: { type: String, required: true, trim: true },
    coldChainTemp: { type: String, default: '4°C', trim: true },
    shelfLife: { type: String, default: '48 hours from milking', trim: true },
    imageUrl: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    variants: [ProductVariantSchema],
}, {
    timestamps: true,
});
ProductSchema.index({ category: 1, isActive: 1 });
exports.ProductModel = mongoose_1.default.models.Product || mongoose_1.default.model('Product', ProductSchema);
//# sourceMappingURL=Product.js.map