import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service';
import { orderGeneratorService } from '../order-generator/order-generator.service';
import { sendSuccess } from '../../utils/response';
import { OrderStatus } from '@ksheeraam/contracts';

export class OrdersController {
  async quote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const quote = await ordersService.getCheckoutQuote(req.user!.id, req.body.items);
      sendSuccess(res, quote, 200);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await ordersService.createOneTimeOrder(req.user!.id, req.body);
      sendSuccess(res, order, 201, 'Order placed successfully.');
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        customerId: req.query.customerId as string | undefined,
        deliveryDate: req.query.deliveryDate as string | undefined,
        status: req.query.status as OrderStatus | undefined,
        assignedAgentId: req.query.assignedAgentId as string | undefined,
      };
      const orders = await ordersService.listOrders(req.user!.id, req.user!.role, filters);
      sendSuccess(res, orders, 200);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const order = await ordersService.getOrderById(id, req.user!.id, req.user!.role);
      sendSuccess(res, order, 200);
    } catch (err) {
      next(err);
    }
  }

  async triggerGeneration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetDate = req.body.targetDate as string | undefined;
      const result = await orderGeneratorService.generateOrdersForDate(targetDate);
      sendSuccess(res, result, 200, 'Scheduled order generation completed.');
    } catch (err) {
      next(err);
    }
  }

  async allocateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const order = await ordersService.allocateStockForOrder(id);
      sendSuccess(res, order, 200, 'Stock allocated to order.');
    } catch (err) {
      next(err);
    }
  }
}

export const ordersController = new OrdersController();
