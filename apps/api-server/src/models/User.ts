import mongoose, { Document, Schema, Model } from 'mongoose';
import { Role } from '@ksheeraam/contracts';

export interface IUser extends Document {
  name: string;
  phone: string;
  email?: string;
  passwordHash?: string;
  role: Role;
  walletBalancePaise: number;
  isActive: boolean;
  assignedRoute?: string;
  vehicleNumber?: string;
  whatsappOptOut: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.CUSTOMER,
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
  },
  {
    timestamps: true,
  }
);

// Unique index on phone
UserSchema.index({ phone: 1 }, { unique: true });
// Sparse unique index on email
UserSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string', $gt: '' } } }
);

export const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
