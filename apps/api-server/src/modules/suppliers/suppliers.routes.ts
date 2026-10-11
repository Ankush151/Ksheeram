import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@ksheeraam/contracts';
import { suppliersController } from './suppliers.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { validate } from '../../middleware/validation';

export const suppliersRouter = Router();

const createSupplierSchema = z.object({
  name: z.string().min(2),
  contactPerson: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  villageDistrict: z.string().min(2),
  state: z.string().optional(),
  milkTypes: z.array(z.string()).min(1),
  dailySupplyCapacityUnits: z.number().int().positive(),
  paymentTerms: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

suppliersRouter.get('/', authenticate, requireRoles(Role.ADMIN), suppliersController.list);
suppliersRouter.get('/:id', authenticate, requireRoles(Role.ADMIN), suppliersController.getById);
suppliersRouter.post(
  '/',
  authenticate,
  requireRoles(Role.ADMIN),
  validate({ body: createSupplierSchema }),
  suppliersController.create
);
suppliersRouter.put('/:id', authenticate, requireRoles(Role.ADMIN), suppliersController.update);
