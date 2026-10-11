import { Router } from 'express';
import { Role } from '@ksheeraam/contracts';
import { whatsAppController } from './whatsapp.controller';
import { authenticate, requireRoles } from '../../middleware/auth';

export const whatsAppRouter = Router();

// Public Meta webhook endpoints
whatsAppRouter.get('/webhook', whatsAppController.verify);
whatsAppRouter.post('/webhook', whatsAppController.handleInbound);

// Admin-assisted inbox routes
whatsAppRouter.get('/messages', authenticate, requireRoles(Role.ADMIN), whatsAppController.list);
whatsAppRouter.get('/requests', authenticate, requireRoles(Role.ADMIN), whatsAppController.list);
whatsAppRouter.patch('/requests/:id/status', authenticate, requireRoles(Role.ADMIN), whatsAppController.updateStatus);
whatsAppRouter.post(
  '/messages/:id/convert',
  authenticate,
  requireRoles(Role.ADMIN),
  whatsAppController.convertToOrder
);
whatsAppRouter.post(
  '/messages/:id/dismiss',
  authenticate,
  requireRoles(Role.ADMIN),
  whatsAppController.dismiss
);
