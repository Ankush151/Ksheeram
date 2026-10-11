import { Request, Response, NextFunction } from 'express';
import { subscriptionsService } from './subscriptions.service';
import { sendSuccess } from '../../utils/response';

export class SubscriptionsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.query.customerId as string | undefined;
      const subs = await subscriptionsService.listSubscriptions(req.user!.id, req.user!.role, customerId);
      sendSuccess(res, subs, 200);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const sub = await subscriptionsService.getSubscriptionById(id, req.user!.id, req.user!.role);
      sendSuccess(res, sub, 200);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sub = await subscriptionsService.createSubscription(req.user!.id, req.body);
      sendSuccess(res, sub, 201, 'Recurring subscription activated successfully.');
    } catch (err) {
      next(err);
    }
  }

  async pause(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const sub = await subscriptionsService.pauseSubscription(id, req.user!.id, req.user!.role, req.body);
      sendSuccess(res, sub, 200, 'Subscription delivery paused.');
    } catch (err) {
      next(err);
    }
  }

  async resume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const sub = await subscriptionsService.resumeSubscription(id, req.user!.id, req.user!.role);
      sendSuccess(res, sub, 200, 'Subscription delivery resumed.');
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const sub = await subscriptionsService.cancelSubscription(id, req.user!.id, req.user!.role);
      sendSuccess(res, sub, 200, 'Subscription cancelled.');
    } catch (err) {
      next(err);
    }
  }

  async updateSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const sub = await subscriptionsService.updateSchedule(id, req.user!.id, req.user!.role, req.body);
      sendSuccess(res, sub, 200, 'Subscription schedule updated.');
    } catch (err) {
      next(err);
    }
  }

  async quote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const quote = await subscriptionsService.quoteSubscription(req.body);
      sendSuccess(res, quote, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const subscriptionsController = new SubscriptionsController();
