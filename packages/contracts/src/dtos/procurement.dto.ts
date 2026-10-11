import { PackageSize, PackagingType } from '../enums';

export interface ProcurementItemDto {
  id?: string;
  productId: string;
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

export interface PurchaseOrderDto {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string; // YYYY-MM-DD
  expectedDeliveryDate: string; // YYYY-MM-DD
  status: 'ordered' | 'received' | 'cancelled';
  items: ProcurementItemDto[];
  totalUnitsOrdered: number;
  totalUnitsReceived: number;
  totalUnitsRejected: number;
  totalCostPaise: number;
  chillingTempVerified?: string;
  qualityTesterName?: string;
  notes?: string;
  createdAt: string;
  receivedAt?: string;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  expectedDeliveryDate: string; // YYYY-MM-DD
  items: {
    productId: string;
    productName: string;
    size: PackageSize;
    packagingType: PackagingType;
    orderedUnits: number;
    unitCostPaise: number;
  }[];
  notes?: string;
}

export interface ReceiveStockDto {
  poId: string;
  chillingTemp: string; // e.g. "3.8°C"
  qualityTesterName: string;
  items: {
    itemId: string;
    receivedUnits: number;
    rejectedUnits: number;
    rejectionReason?: string;
  }[];
}
