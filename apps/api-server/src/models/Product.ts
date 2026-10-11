import mongoose, { Document, Schema, Model } from 'mongoose';
import { MilkCategory, PackageSize, PackagingType } from '@ksheeraam/contracts';

export interface IProductVariant {
  _id?: mongoose.Types.ObjectId;
  size: PackageSize;
  packagingType: PackagingType;
  pricePaise: number; // in integer paise
  mrpPaise: number;
  inStock: boolean;
  saleableUnits: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  category: MilkCategory;
  fatContent: string;
  snfContent: string;
  coldChainTemp: string;
  shelfLife: string;
  imageUrl: string;
  isActive: boolean;
  variants: IProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    size: {
      type: String,
      enum: Object.values(PackageSize),
      required: true,
    },
    packagingType: {
      type: String,
      enum: Object.values(PackagingType),
      default: PackagingType.GLASS_BOTTLE,
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
  },
  { _id: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, trim: true },
    category: {
      type: String,
      enum: Object.values(MilkCategory),
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
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ category: 1, isActive: 1 });

export const ProductModel: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
