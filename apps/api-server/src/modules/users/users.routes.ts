import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@ksheeraam/contracts';
import { usersController } from './users.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { validate } from '../../middleware/validation';

export const usersRouter = Router();

const addressSchema = z.object({
  label: z.string().optional().default('Home'),
  flatNumber: z.string().min(1),
  buildingName: z.string().min(1),
  streetArea: z.string().min(2),
  landmark: z.string().optional(),
  city: z.string().optional().default('Bangalore'),
  pincode: z.string().min(6),
  isDefault: z.boolean().optional(),
  deliveryInstructions: z.string().optional(),
});

// Admin-only user list
usersRouter.get('/', authenticate, requireRoles(Role.ADMIN), usersController.listUsers);
usersRouter.get('/:id', authenticate, usersController.getUser);

// Addresses routes
usersRouter.get('/:userId/addresses', authenticate, usersController.listAddresses);
usersRouter.get('/me/addresses', authenticate, usersController.listAddresses);
usersRouter.post('/me/addresses', authenticate, validate({ body: addressSchema }), usersController.createAddress);
usersRouter.put('/me/addresses/:id', authenticate, usersController.updateAddress);
usersRouter.delete('/me/addresses/:id', authenticate, usersController.deleteAddress);
