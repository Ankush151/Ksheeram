import mongoose, { Document, Schema, Model } from 'mongoose';
import { PackageSize, PackagingType } from '@ksheeraam/contracts';

export interface IProcurementItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  size: PackageSize;
  packagingType: PackagingType;
  orderedUnits: number;
  receivedUnits: number;
  rejectedUnits: number;
  unitCostPaise: number;
  totalCostPaise: number;
  rejectionReason?: string;
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  orderDate: string; // YYYY-MM-DD
  expectedDeliveryDate: string; // YYYY-MM-DD
  status: 'ordered' | 'received' | 'cancelled';
  items: IProcurementItem[];
  totalUnitsOrdered: number;
  totalUnitsReceived: number;
  totalUnitsRejected: number;
  totalCostPaise: number;
  chillingTempVerified?: string;
  qualityTesterName?: string;
  notes?: string;
  receivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProcurementItemSchema = new Schema<IProcurementItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    size: { type: String, enum: Object.values(PackageSize), required: true },
    packagingType: {
      type: String,
      enum: Object.values(PackagingType),
      default: PackagingType.GLASS_BOTTLE,
      required: true,
    },
    orderedUnits: { type: Number, required: true, validate: Number.isInteger },
    receivedUnits: { type: Number, default: 0, validate: Number.isInteger },
    rejectedUnits: { type: Number, default: 0, validate: Number.isInteger },
    unitCostPaise: { type: Number, required: true, validate: Number.isInteger },
    totalCostPaise: { type: Number, required: true, validate: Number.isInteger },
    rejectionReason: { type: String, trim: true },
  },
  { _id: true }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, unique: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
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
  },
  {
    timestamps: true,
  }
);

export const PurchaseOrderModel: Model<IPurchaseOrder> =
  mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
