import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service';
import { sendSuccess } from '../../utils/response';

export class InventoryController {
  async listBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const balances = await inventoryService.listBalances();
      sendSuccess(res, balances, 200);
    } catch (err) {
      next(err);
    }
  }

  async listMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const movements = await inventoryService.listMovements(limit);
      sendSuccess(res, movements, 200);
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { inventoryId, adjustmentType, units, reason } = req.body;
      const balance = await inventoryService.adjustStock(
        inventoryId,
        adjustmentType,
        units,
        reason,
        req.user?.name || 'ADMIN'
      );
      sendSuccess(res, balance, 200, 'Inventory stock adjusted successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export const inventoryController = new InventoryController();
