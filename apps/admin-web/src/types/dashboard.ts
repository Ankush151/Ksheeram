export interface StockSummaryItem {
  productId: string;
  productName: string;
  size: '500ml' | '1L';
  physical: number;
  reserved: number;
  available: number;
  damaged: number;
}

export interface DemandForecastItem {
  productId: string;
  productName: string;
  size: '500ml' | '1L';
  unitsNeededTomorrow: number;
  expectedProcurement: number;
  projectedShortage: number;
}

export interface LowStockAlertItem {
  productId: string;
  productName: string;
  size: '500ml' | '1L';
  currentAvailable: number;
  minThreshold: number;
  urgency: 'critical' | 'warning';
}

export interface DashboardStats {
  todayScheduledOrders: number;
  ordersAwaitingStockAllocation: number;
  deliveries: {
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    total: number;
  };
  paymentReconciliationAlerts: number;
  packagedStock: StockSummaryItem[];
  tomorrowDemand: DemandForecastItem[];
  lowStockWarnings: LowStockAlertItem[];
}
