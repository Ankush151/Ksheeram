import { Router } from 'express';
import { z } from 'zod';
import { PackageSize, PackagingType, PaymentMethod, Role } from '@ksheeraam/contracts';
import { ordersController } from './orders.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { validate } from '../../middleware/validation';

export const ordersRouter = Router();

const quoteSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        size: z.nativeEnum(PackageSize).optional().default(PackageSize.L_1),
        packagingType: z.nativeEnum(PackagingType).optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  addressId: z.string().optional(),
  couponCode: z.string().optional(),
});

const createOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          variantId: z.string().optional(),
          size: z.nativeEnum(PackageSize).optional().default(PackageSize.L_1),
          packagingType: z.nativeEnum(PackagingType).optional(),
          quantity: z.number().int().positive(),
        })
      )
      .min(1),
    addressId: z.string().optional(),
    deliveryAddressId: z.string().optional(),
    deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    deliverySlot: z.string().optional(),
    paymentMethod: z.string(),
    instructions: z.string().optional(),
    deliveryInstructions: z.string().optional(),
    idempotencyKey: z.string().optional(),
  })
  .transform((data) => {
    let pm = PaymentMethod.WALLET;
    const pmLower = data.paymentMethod.toLowerCase();
    if (pmLower.includes('cod') || pmLower.includes('cash')) pm = PaymentMethod.COD;
    else if (pmLower.includes('upi')) pm = PaymentMethod.UPI;
    else if (pmLower.includes('card')) pm = PaymentMethod.CARD;
    else if (pmLower.includes('wallet')) pm = PaymentMethod.WALLET;

    return {
      items: data.items,
      addressId: data.addressId || data.deliveryAddressId || '',
      deliveryDate: data.deliveryDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliverySlot: data.deliverySlot || 'Morning 5:30 AM - 7:00 AM',
      paymentMethod: pm,
      instructions: data.instructions || data.deliveryInstructions,
      idempotencyKey: data.idempotencyKey,
    };
  });

ordersRouter.post('/quote', authenticate, validate({ body: quoteSchema }), ordersController.quote);
ordersRouter.post('/', authenticate, validate({ body: createOrderSchema }), ordersController.create);
ordersRouter.get('/', authenticate, ordersController.list);
ordersRouter.get('/:id', authenticate, ordersController.getById);

// Stock allocation for orders (Admin-only)
ordersRouter.post(
  '/:id/allocate-stock',
  authenticate,
  requireRoles(Role.ADMIN),
  ordersController.allocateStock
);
ordersRouter.post(
  '/:id/allocate',
  authenticate,
  requireRoles(Role.ADMIN),
  ordersController.allocateStock
);

// Admin-only order generator run
ordersRouter.post(
  '/generate-daily',
  authenticate,
  requireRoles(Role.ADMIN),
  ordersController.triggerGeneration
);
