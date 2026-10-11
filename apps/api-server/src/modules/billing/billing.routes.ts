import { Router } from 'express';
import { z } from 'zod';
import { PaymentMethod, Role } from '@ksheeraam/contracts';
import { billingController } from './billing.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { validate } from '../../middleware/validation';

export const billingRouter = Router();

const topupSchema = z.object({
  amountPaise: z.number().int().positive(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  idempotencyKey: z.string().optional(),
});

billingRouter.get('/invoices', authenticate, billingController.listInvoices);
billingRouter.get('/invoices/:id', authenticate, billingController.getInvoiceById);
billingRouter.post(
  '/invoices/order/:orderId',
  authenticate,
  requireRoles(Role.ADMIN),
  billingController.createInvoiceForOrder
);

billingRouter.get('/ledger', authenticate, billingController.listLedger);
billingRouter.post('/topup', authenticate, validate({ body: topupSchema }), billingController.topupWallet);

// Webhook endpoint (unauthenticated, secured via HMAC signature header)
billingRouter.post('/webhook', billingController.handleWebhook);

// Admin reconciliation alerts
billingRouter.get('/alerts', authenticate, requireRoles(Role.ADMIN), billingController.listAlerts);
billingRouter.get('/reconciliations', authenticate, requireRoles(Role.ADMIN), billingController.listAlerts);
billingRouter.post('/alerts/:id/resolve', authenticate, requireRoles(Role.ADMIN), billingController.resolveAlert);
billingRouter.post('/reconciliations/:id/resolve', authenticate, requireRoles(Role.ADMIN), billingController.resolveAlert);
