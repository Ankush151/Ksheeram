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
exports.UserModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const contracts_1 = require("@ksheeraam/contracts");
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    passwordHash: { type: String },
    role: {
        type: String,
        enum: Object.values(contracts_1.Role),
        default: contracts_1.Role.CUSTOMER,
        required: true,
        index: true,
    },
    walletBalancePaise: {
        type: Number,
        default: 0,
        required: true,
        validate: {
            validator: Number.isInteger,
            message: 'walletBalancePaise must be an integer paise amount',
        },
    },
    isActive: { type: Boolean, default: true, index: true },
    assignedRoute: { type: String, trim: true },
    vehicleNumber: { type: String, trim: true },
    whatsappOptOut: { type: Boolean, default: false },
}, {
    timestamps: true,
});
// Unique index on phone
UserSchema.index({ phone: 1 }, { unique: true });
// Sparse unique index on email
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string', $gt: '' } } });
exports.UserModel = mongoose_1.default.models.User || mongoose_1.default.model('User', UserSchema);
//# sourceMappingURL=User.js.map