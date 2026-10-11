import mongoose, { Document, Schema, Model } from 'mongoose';
import { PackageSize, PackagingType, StockMovementType } from '@ksheeraam/contracts';

export interface IInventoryBalance extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  size: PackageSize;
  packagingType: PackagingType;
  physicalUnits: number; // Saleable inventory on hand
  reservedUnits: number; // Allocated to confirmed orders
  damagedUnits: number;
  reorderLevel: number;
  lastUpdated: Date;
  availableUnits: number; // virtual / getter
}

export interface IInventoryMovement extends Document {
  inventoryId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productName: string;
  size: PackageSize;
  packagingType: PackagingType;
  movementType: StockMovementType;
  deltaUnits: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  reason: string;
  performedBy: string;
  timestamp: Date;
}

const InventoryBalanceSchema = new Schema<IInventoryBalance>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    size: { type: String, enum: Object.values(PackageSize), required: true },
    packagingType: {
      type: String,
      enum: Object.values(PackagingType),
      default: PackagingType.GLASS_BOTTLE,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property for availableUnits = physicalUnits - reservedUnits
InventoryBalanceSchema.virtual('availableUnits').get(function () {
  return Math.max(0, this.physicalUnits - this.reservedUnits);
});

// Compound unique index ensuring only 1 record exists per (productId, size, packagingType)
InventoryBalanceSchema.index({ productId: 1, size: 1, packagingType: 1 }, { unique: true });

const InventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    inventoryId: { type: Schema.Types.ObjectId, ref: 'InventoryBalance', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    size: { type: String, enum: Object.values(PackageSize), required: true },
    packagingType: {
      type: String,
      enum: Object.values(PackagingType),
      default: PackagingType.GLASS_BOTTLE,
      required: true,
    },
    movementType: {
      type: String,
      enum: Object.values(StockMovementType),
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
  },
  {
    timestamps: true,
  }
);

export const InventoryBalanceModel: Model<IInventoryBalance> =
  mongoose.models.InventoryBalance ||
  mongoose.model<IInventoryBalance>('InventoryBalance', InventoryBalanceSchema);

export const InventoryMovementModel: Model<IInventoryMovement> =
  mongoose.models.InventoryMovement ||
  mongoose.model<IInventoryMovement>('InventoryMovement', InventoryMovementSchema);
