import { Router } from 'express';
import { Role } from '@ksheeraam/contracts';
import { authenticate, requireRoles } from '../../middleware/auth';
import { reportsController } from '../reports/reports.controller';
import { inventoryRouter } from '../inventory/inventory.routes';
import { ordersRouter } from '../orders/orders.routes';
import { deliveryRouter } from '../delivery/delivery.routes';
import { procurementRouter } from '../procurement/procurement.routes';
import { suppliersRouter } from '../suppliers/suppliers.routes';
import { productsRouter } from '../products/products.routes';
import { whatsAppRouter } from '../whatsapp/whatsapp.routes';
import { subscriptionsRouter } from '../subscriptions/subscriptions.routes';
import { usersRouter } from '../users/users.routes';
import { billingRouter } from '../billing/billing.routes';
import { reportsRouter } from '../reports/reports.routes';

export const adminRouter = Router();

// Dashboard stats endpoint for operations management
adminRouter.get(
  '/dashboard/stats',
  authenticate,
  requireRoles(Role.ADMIN),
  reportsController.getDashboardStats
);

// Mount core business modules under /api/v1/admin/*
adminRouter.use('/inventory', inventoryRouter);
adminRouter.use('/orders', ordersRouter);
adminRouter.use('/delivery', deliveryRouter);
adminRouter.use('/procurement', procurementRouter);
adminRouter.use('/suppliers', suppliersRouter);
adminRouter.use('/products', productsRouter);
adminRouter.use('/whatsapp', whatsAppRouter);
adminRouter.use('/subscriptions', subscriptionsRouter);
adminRouter.use('/customers', usersRouter);
adminRouter.use('/billing', billingRouter);
adminRouter.use('/reports', reportsRouter);
