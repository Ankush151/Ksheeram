import { PackageSize } from './products';

export interface ProcurementItem {
  id: string;
  productId: string;
  productName: string;
  size: PackageSize;
  packagingType: 'glass_bottle' | 'eco_pouch' | 'Glass Bottle' | 'Pouch' | string;
  orderedUnits: number;
  receivedUnits: number;
  rejectedUnits: number;
  unitCost: number;
  totalCost: number;
  rejectionReason?: string;
}

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'received' | 'partially_received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: PurchaseOrderStatus;
  items: ProcurementItem[];
  totalUnitsOrdered: number;
  totalUnitsReceived: number;
  totalUnitsRejected: number;
  totalAmount: number;
  chillingTempVerifiedAtReceipt?: string | number;
  qualityTesterName?: string;
  notes?: string;
  createdAt: string;
  receivedAt?: string;
}

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  expectedDeliveryDate: string;
  items: {
    productId: string;
    productName: string;
    size: PackageSize;
    packagingType: 'glass_bottle' | 'eco_pouch' | 'Glass Bottle' | 'Pouch' | string;
    orderedUnits: number;
    unitCost: number;
  }[];
  notes?: string;
}

export interface ReceiveStockPayload {
  poId: string;
  items: {
    itemId: string;
    receivedUnits: number;
    rejectedUnits: number;
    rejectionReason?: string;
  }[];
  chillingTemp: string | number;
  qualityTesterName: string;
  notes?: string;
}
