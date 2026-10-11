import { Router } from 'express';
import { z } from 'zod';
import { DeliveryFailureReason, Role } from '@ksheeraam/contracts';
import { deliveryController } from './delivery.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { validate } from '../../middleware/validation';

export const deliveryRouter = Router();

const assignSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1),
  agentId: z.string().min(1),
});

const completeSchema = z.object({
  orderId: z.string().min(1),
  cashCollectedPaise: z.number().int().min(0).optional(),
  agentNotes: z.string().optional(),
});

const failSchema = z.object({
  orderId: z.string().min(1),
  reason: z.nativeEnum(DeliveryFailureReason),
  notes: z.string().optional(),
});

// Manifest query accessible to admins and delivery agents
deliveryRouter.get(
  '/manifest',
  authenticate,
  requireRoles(Role.ADMIN, Role.DELIVERY_AGENT),
  deliveryController.getManifest
);

deliveryRouter.get(
  '/agents',
  authenticate,
  requireRoles(Role.ADMIN),
  deliveryController.listAgents
);

deliveryRouter.get(
  '/agent/:agentId/manifest',
  authenticate,
  requireRoles(Role.ADMIN, Role.DELIVERY_AGENT),
  deliveryController.getAgentManifest
);

// Admin-only route to assign agents
deliveryRouter.post(
  '/assign',
  authenticate,
  requireRoles(Role.ADMIN),
  validate({ body: assignSchema }),
  deliveryController.assign
);

// Delivery agent & Admin completion / failure routes
deliveryRouter.post(
  '/complete',
  authenticate,
  requireRoles(Role.ADMIN, Role.DELIVERY_AGENT),
  validate({ body: completeSchema }),
  deliveryController.complete
);

deliveryRouter.post(
  '/fail',
  authenticate,
  requireRoles(Role.ADMIN, Role.DELIVERY_AGENT),
  validate({ body: failSchema }),
  deliveryController.fail
);
