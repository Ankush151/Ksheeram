import { Request, Response, NextFunction } from 'express';
import { procurementService } from './procurement.service';
import { sendSuccess } from '../../utils/response';

export class ProcurementController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pos = await procurementService.listPurchaseOrders();
      sendSuccess(res, pos, 200);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const po = await procurementService.getPurchaseOrderById(id);
      sendSuccess(res, po, 200);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const po = await procurementService.createPurchaseOrder(req.body);
      sendSuccess(res, po, 201, 'Purchase order placed successfully.');
    } catch (err) {
      next(err);
    }
  }

  async receiveStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const po = await procurementService.receiveStock(req.body, req.user?.name || 'QUALITY_TESTER');
      sendSuccess(res, po, 200, 'Stock received and inventory inwarded successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export const procurementController = new ProcurementController();
