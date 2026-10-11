import { Request, Response, NextFunction } from 'express';
import { Role } from '@ksheeraam/contracts';
import { deliveryService } from './delivery.service';
import { sendSuccess } from '../../utils/response';
import { getKolkataDateString } from '@ksheeraam/contracts';
import { UserModel } from '../../models/User';
import { mapUserToDto } from '../auth/auth.service';
import { ForbiddenError } from '../../utils/errors';

export class DeliveryController {
  async getManifest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = (req.query.date as string) || getKolkataDateString();
      const manifest = await deliveryService.getDailyManifest(date, req.user!.id, req.user!.role);
      sendSuccess(res, manifest, 200);
    } catch (err) {
      next(err);
    }
  }

  async getAgentManifest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const agentId = String(req.params.agentId || req.user!.id);
      if (req.user!.role === Role.DELIVERY_AGENT && agentId !== req.user!.id) {
        throw new ForbiddenError('You can only view your own delivery manifest.');
      }
      const date = (req.query.date as string) || getKolkataDateString();
      const manifest = await deliveryService.getDailyManifest(date, agentId, req.user!.role);
      sendSuccess(res, manifest, 200);
    } catch (err) {
      next(err);
    }
  }

  async listAgents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const agents = await UserModel.find({ role: Role.DELIVERY_AGENT, isActive: true });
      sendSuccess(res, agents.map(mapUserToDto), 200);
    } catch (err) {
      next(err);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await deliveryService.assignAgent(req.body);
      sendSuccess(res, result, 200, 'Orders assigned to delivery agent.');
    } catch (err) {
      next(err);
    }
  }

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await deliveryService.completeDelivery(req.body, req.user!.id, req.user!.role);
      sendSuccess(res, item, 200, 'Delivery confirmed as completed.');
    } catch (err) {
      next(err);
    }
  }

  async fail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await deliveryService.failDelivery(req.body, req.user!.id, req.user!.role);
      sendSuccess(res, item, 200, 'Delivery marked as failed.');
    } catch (err) {
      next(err);
    }
  }
}

export const deliveryController = new DeliveryController();
