import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../../middleware/auth';

export const notificationsRouter = Router();

notificationsRouter.get('/', authenticate, notificationsController.list);
