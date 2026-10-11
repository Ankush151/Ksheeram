import { adminApiClient } from '@/services/api-client';
import { adminMockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import { InventoryItem, StockMovementLog, AdjustStockPayload } from '@/types/inventory';

export const inventoryApi = {
  async getInventory(): Promise<InventoryItem[]> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.getInventory();
    }
    return adminApiClient.get<InventoryItem[]>('/admin/inventory');
  },

  async getStockLogs(): Promise<StockMovementLog[]> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.getStockLogs();
    }
    return adminApiClient.get<StockMovementLog[]>('/admin/inventory/logs');
  },

  async adjustStock(payload: AdjustStockPayload): Promise<InventoryItem> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.adjustStock(payload);
    }
    return adminApiClient.post<InventoryItem>('/admin/inventory/adjust', payload);
  },
};
