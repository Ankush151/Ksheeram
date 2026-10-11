import { Router } from 'express';
import { z } from 'zod';
import { PackageSize, PackagingType, Role } from '@ksheeraam/contracts';
import { procurementController } from './procurement.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { validate } from '../../middleware/validation';

export const procurementRouter = Router();

const createPOSchema = z.object({
  supplierId: z.string().min(1),
  expectedDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        productName: z.string().min(1),
        size: z.nativeEnum(PackageSize),
        packagingType: z.nativeEnum(PackagingType),
        orderedUnits: z.number().int().positive(),
        unitCostPaise: z.number().int().positive(),
      })
    )
    .min(1),
  notes: z.string().optional(),
});

const receiveStockSchema = z.object({
  poId: z.string().min(1),
  chillingTemp: z.string().min(1),
  qualityTesterName: z.string().min(2),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1),
        receivedUnits: z.number().int().min(0),
        rejectedUnits: z.number().int().min(0),
        rejectionReason: z.string().optional(),
      })
    )
    .min(1),
});

procurementRouter.get('/', authenticate, requireRoles(Role.ADMIN), procurementController.list);
procurementRouter.get('/orders', authenticate, requireRoles(Role.ADMIN), procurementController.list);
procurementRouter.get('/:id', authenticate, requireRoles(Role.ADMIN), procurementController.getById);
procurementRouter.post(
  '/',
  authenticate,
  requireRoles(Role.ADMIN),
  validate({ body: createPOSchema }),
  procurementController.create
);
procurementRouter.post(
  '/orders',
  authenticate,
  requireRoles(Role.ADMIN),
  validate({ body: createPOSchema }),
  procurementController.create
);
procurementRouter.post(
  '/receive',
  authenticate,
  requireRoles(Role.ADMIN),
  validate({ body: receiveStockSchema }),
  procurementController.receiveStock
);
