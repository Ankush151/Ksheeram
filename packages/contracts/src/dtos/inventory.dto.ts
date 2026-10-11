import { PackageSize, PackagingType, StockMovementType } from '../enums';

export interface InventoryBalanceDto {
  id: string;
  productId: string;
  productName: string;
  size: PackageSize;
  packagingType: PackagingType;
  physicalUnits: number;
  reservedUnits: number;
  availableUnits: number; // calculated physical - reserved
  damagedUnits: number;
  reorderLevel: number;
  lastUpdated: string;
}

export interface StockMovementDto {
  id: string;
  inventoryId: string;
  productId: string;
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
  timestamp: string;
}

export interface AdjustStockDto {
  inventoryId: string;
  adjustmentType: 'add_stock' | 'mark_damaged' | 'audit_adjustment';
  units: number;
  reason: string;
}
