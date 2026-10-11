import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISupplier extends Document {
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  villageDistrict: string;
  state: string;
  milkTypes: string[];
  dailySupplyCapacityUnits: number;
  paymentTerms: string;
  rating: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
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
  },
  {
    timestamps: true,
  }
);

export const SupplierModel: Model<ISupplier> =
  mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
