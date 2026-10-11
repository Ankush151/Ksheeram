import { PackageSize } from './products';

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  size: PackageSize;
  packagingType: 'glass_bottle' | 'eco_pouch';
  physicalUnits: number;
  reservedUnits: number;
  availableUnits: number; // physical - reserved
  damagedUnits: number;
  reorderLevel: number;
  lastUpdated: string;
}

export type MovementType =
  | 'procurement_inward'
  | 'order_reservation'
  | 'morning_dispatch'
  | 'damage_spoilage'
  | 'audit_adjustment';

export interface StockMovementLog {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  size: PackageSize;
  movementType: MovementType;
  deltaUnits: number; // e.g. +120 or -15
  balanceAfter: number;
  referenceId?: string; // PO number or Order ID
  reason: string;
  performedBy: string;
}

export interface AdjustStockPayload {
  inventoryId: string;
  adjustmentType: 'add_stock' | 'mark_damaged' | 'manual_audit' | 'audit_adjustment';
  units: number;
  reason: string;
  notes?: string;
}
