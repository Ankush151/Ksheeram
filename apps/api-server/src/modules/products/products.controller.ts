import { Request, Response, NextFunction } from 'express';
import { MilkCategory } from '@ksheeraam/contracts';
import { productsService } from './products.service';
import { sendSuccess } from '../../utils/response';

export class ProductsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as MilkCategory | undefined;
      const search = req.query.search as string | undefined;
      const activeOnly = req.query.all === 'true' ? false : true;
      const products = await productsService.listProducts({ category, search, activeOnly });
      sendSuccess(res, products, 200);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const product = await productsService.getProductById(id);
      sendSuccess(res, product, 200);
    } catch (err) {
      next(err);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = String(req.params.slug);
      const product = await productsService.getProductBySlug(slug);
      sendSuccess(res, product, 200);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.createProduct(req.body);
      sendSuccess(res, product, 201, 'Product created successfully.');
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const product = await productsService.updateProduct(id, req.body);
      sendSuccess(res, product, 200, 'Product updated successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export const productsController = new ProductsController();
