import { Router } from 'express';
import { z } from 'zod';
import { PackageSize, SubscriptionFrequency } from '@ksheeraam/contracts';
import { subscriptionsController } from './subscriptions.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';

export const subscriptionsRouter = Router();

const createSubscriptionSchema = z.object({
  frequency: z.nativeEnum(SubscriptionFrequency),
  customDays: z.array(z.number().min(0).max(6)).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        size: z.nativeEnum(PackageSize).optional().default(PackageSize.L_1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  addressId: z.string().optional(),
  deliveryAddressId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  deliverySlot: z.string().optional(),
  paymentMethod: z.string().optional(),
}).transform((data) => ({
  ...data,
  addressId: data.addressId || data.deliveryAddressId || '',
  startDate: data.startDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
}));

const pauseSchema = z.object({
  pauseStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  pauseEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reason: z.string().optional(),
}).transform((data) => {
  const tomorrow = new Date(Date.now() + 86400000);
  const nextWeek = new Date(Date.now() + 8 * 86400000);
  return {
    ...data,
    pauseStartDate: data.pauseStartDate || tomorrow.toISOString().split('T')[0],
    pauseEndDate: data.pauseEndDate || nextWeek.toISOString().split('T')[0],
  };
});

const updateScheduleSchema = z.object({
  frequency: z.nativeEnum(SubscriptionFrequency).optional(),
  customDays: z.array(z.number().min(0).max(6)).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        size: z.nativeEnum(PackageSize),
        quantity: z.number().int().positive(),
      })
    )
    .optional(),
  effectiveFromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

subscriptionsRouter.get('/', authenticate, subscriptionsController.list);
subscriptionsRouter.post('/quote', subscriptionsController.quote);
subscriptionsRouter.get('/:id', authenticate, subscriptionsController.getById);
subscriptionsRouter.post('/', authenticate, validate({ body: createSubscriptionSchema }), subscriptionsController.create);
subscriptionsRouter.post('/:id/pause', authenticate, validate({ body: pauseSchema }), subscriptionsController.pause);
subscriptionsRouter.post('/:id/resume', authenticate, subscriptionsController.resume);
subscriptionsRouter.post('/:id/cancel', authenticate, subscriptionsController.cancel);
subscriptionsRouter.put('/:id/schedule', authenticate, validate({ body: updateScheduleSchema }), subscriptionsController.updateSchedule);
