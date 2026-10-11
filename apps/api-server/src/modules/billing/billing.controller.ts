import { Request, Response, NextFunction } from 'express';
import { billingService } from './billing.service';
import { sendSuccess } from '../../utils/response';

export class BillingController {
  async listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.query.customerId as string | undefined;
      const invoices = await billingService.listInvoices(req.user!.id, req.user!.role, customerId);
      sendSuccess(res, invoices, 200);
    } catch (err) {
      next(err);
    }
  }

  async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const invoice = await billingService.getInvoiceById(id, req.user!.id, req.user!.role);
      sendSuccess(res, invoice, 200);
    } catch (err) {
      next(err);
    }
  }

  async createInvoiceForOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.orderId);
      const invoice = await billingService.createInvoiceForOrder(orderId);
      sendSuccess(res, invoice, 201, 'Invoice generated.');
    } catch (err) {
      next(err);
    }
  }

  async listLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.query.customerId as string | undefined;
      const ledger = await billingService.listPrepaidLedger(req.user!.id, req.user!.role, customerId);
      sendSuccess(res, ledger, 200);
    } catch (err) {
      next(err);
    }
  }

  async topupWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const amountPaise = req.body.amountPaise !== undefined
        ? req.body.amountPaise
        : typeof req.body.amount === 'number'
        ? Math.round(req.body.amount * 100)
        : 0;
      const { paymentMethod, idempotencyKey } = req.body;
      const result = await billingService.topupWallet(
        req.user!.id,
        amountPaise,
        paymentMethod,
        idempotencyKey
      );
      sendSuccess(res, result, 200, 'Wallet credited successfully.');
    } catch (err) {
      next(err);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = (req.headers['x-razorpay-signature'] as string) || '';
      const result = await billingService.processPaymentWebhook(req.body, signature, req.body);
      sendSuccess(res, result, 200, 'Webhook processed.');
    } catch (err) {
      next(err);
    }
  }

  async listAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const alerts = await billingService.getReconciliationAlerts();
      sendSuccess(res, alerts, 200);
    } catch (err) {
      next(err);
    }
  }

  async resolveAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const notes = (req.body && req.body.notes) ? String(req.body.notes) : undefined;
      const alert = await billingService.resolveAlert(id, notes);
      sendSuccess(res, alert, 200, 'Reconciliation alert resolved.');
    } catch (err) {
      next(err);
    }
  }
}

export const billingController = new BillingController();
