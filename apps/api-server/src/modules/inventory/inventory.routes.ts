import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@ksheeraam/contracts';
import { inventoryController } from './inventory.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { validate } from '../../middleware/validation';

export const inventoryRouter = Router();

const adjustSchema = z.object({
  inventoryId: z.string().min(1),
  adjustmentType: z.enum(['add_stock', 'mark_damaged', 'audit_adjustment']),
  units: z.number().int().positive(),
  reason: z.string().min(3),
});

// Admin & Delivery agents can view inventory balances
inventoryRouter.get('/', authenticate, requireRoles(Role.ADMIN, Role.DELIVERY_AGENT), inventoryController.listBalances);
inventoryRouter.get('/movements', authenticate, requireRoles(Role.ADMIN), inventoryController.listMovements);
inventoryRouter.get('/logs', authenticate, requireRoles(Role.ADMIN), inventoryController.listMovements);
inventoryRouter.post(
  '/adjust',
  authenticate,
  requireRoles(Role.ADMIN),
  validate({ body: adjustSchema }),
  inventoryController.adjustStock
);
