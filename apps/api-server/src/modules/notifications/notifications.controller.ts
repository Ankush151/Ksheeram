import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess } from '../../utils/response';

export class NotificationsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await notificationsService.listUserNotifications(req.user!.id);
      sendSuccess(res, items, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const notificationsController = new NotificationsController();
