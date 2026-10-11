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
exports.SupplierModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SupplierSchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    villageDistrict: { type: String, required: true, trim: true },
    state: { type: String, required: true, default: 'Karnataka', trim: true },
    milkTypes: [{ type: String, trim: true }],
    dailySupplyCapacityUnits: { type: Number, required: true, default: 500 },
    paymentTerms: { type: String, default: 'Weekly Bank Transfer', trim: true },
    rating: { type: Number, default: 4.8, min: 1, max: 5 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
}, {
    timestamps: true,
});
exports.SupplierModel = mongoose_1.default.models.Supplier || mongoose_1.default.model('Supplier', SupplierSchema);
//# sourceMappingURL=Supplier.js.map