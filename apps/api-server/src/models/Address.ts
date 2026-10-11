import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  label: string;
  flatNumber: string;
  buildingName: string;
  streetArea: string;
  landmark?: string;
  city: string;
  pincode: string;
  isDefault: boolean;
  deliveryInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, default: 'Home', trim: true },
    flatNumber: { type: String, required: true, trim: true },
    buildingName: { type: String, required: true, trim: true },
    streetArea: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, required: true, default: 'Bangalore', trim: true },
    pincode: { type: String, required: true, trim: true, index: true },
    isDefault: { type: Boolean, default: false },
    deliveryInstructions: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

AddressSchema.index({ userId: 1, isDefault: -1 });

export const AddressModel: Model<IAddress> =
  mongoose.models.Address || mongoose.model<IAddress>('Address', AddressSchema);
