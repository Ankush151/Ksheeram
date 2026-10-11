import { Request, Response, NextFunction } from 'express';
import { suppliersService } from './suppliers.service';
import { sendSuccess } from '../../utils/response';

export class SuppliersController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const suppliers = await suppliersService.listSuppliers();
      sendSuccess(res, suppliers, 200);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const supplier = await suppliersService.getSupplierById(id);
      sendSuccess(res, supplier, 200);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await suppliersService.createSupplier(req.body);
      sendSuccess(res, supplier, 201, 'Supplier registered successfully.');
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const supplier = await suppliersService.updateSupplier(id, req.body);
      sendSuccess(res, supplier, 200, 'Supplier updated successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export const suppliersController = new SuppliersController();
