import { Router } from 'express';
import { z } from 'zod';
import { MilkCategory, PackageSize, PackagingType, Role } from '@ksheeraam/contracts';
import { productsController } from './products.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { validate } from '../../middleware/validation';

export const productsRouter = Router();

const createProductSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  category: z.nativeEnum(MilkCategory),
  fatContent: z.string(),
  snfContent: z.string(),
  coldChainTemp: z.string().optional().default('4°C'),
  shelfLife: z.string().optional().default('48 hours'),
  imageUrl: z.string().min(1),
  isActive: z.boolean().optional(),
  variants: z
    .array(
      z.object({
        size: z.nativeEnum(PackageSize),
        packagingType: z.nativeEnum(PackagingType),
        pricePaise: z.number().int().positive(),
        mrpPaise: z.number().int().positive(),
      })
    )
    .min(1),
});

productsRouter.get('/', productsController.list);
productsRouter.get('/:id', productsController.getById);
productsRouter.get('/slug/:slug', productsController.getBySlug);

// Admin-only creation & editing
productsRouter.post(
  '/',
  authenticate,
  requireRoles(Role.ADMIN),
  validate({ body: createProductSchema }),
  productsController.create
);
productsRouter.put('/:id', authenticate, requireRoles(Role.ADMIN), productsController.update);
