"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingController = exports.BillingController = void 0;
const billing_service_1 = require("./billing.service");
const response_1 = require("../../utils/response");
class BillingController {
    async listInvoices(req, res, next) {
        try {
            const customerId = req.query.customerId;
            const invoices = await billing_service_1.billingService.listInvoices(req.user.id, req.user.role, customerId);
            (0, response_1.sendSuccess)(res, invoices, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async getInvoiceById(req, res, next) {
        try {
            const id = String(req.params.id);
            const invoice = await billing_service_1.billingService.getInvoiceById(id, req.user.id, req.user.role);
            (0, response_1.sendSuccess)(res, invoice, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async createInvoiceForOrder(req, res, next) {
        try {
            const orderId = String(req.params.orderId);
            const invoice = await billing_service_1.billingService.createInvoiceForOrder(orderId);
            (0, response_1.sendSuccess)(res, invoice, 201, 'Invoice generated.');
        }
        catch (err) {
            next(err);
        }
    }
    async listLedger(req, res, next) {
        try {
            const customerId = req.query.customerId;
            const ledger = await billing_service_1.billingService.listPrepaidLedger(req.user.id, req.user.role, customerId);
            (0, response_1.sendSuccess)(res, ledger, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async topupWallet(req, res, next) {
        try {
            const amountPaise = req.body.amountPaise !== undefined
                ? req.body.amountPaise
                : typeof req.body.amount === 'number'
                    ? Math.round(req.body.amount * 100)
                    : 0;
            const { paymentMethod, idempotencyKey } = req.body;
            const result = await billing_service_1.billingService.topupWallet(req.user.id, amountPaise, paymentMethod, idempotencyKey);
            (0, response_1.sendSuccess)(res, result, 200, 'Wallet credited successfully.');
        }
        catch (err) {
            next(err);
        }
    }
    async handleWebhook(req, res, next) {
        try {
            const signature = req.headers['x-razorpay-signature'] || '';
            const result = await billing_service_1.billingService.processPaymentWebhook(req.body, signature, req.body);
            (0, response_1.sendSuccess)(res, result, 200, 'Webhook processed.');
        }
        catch (err) {
            next(err);
        }
    }
    async listAlerts(req, res, next) {
        try {
            const alerts = await billing_service_1.billingService.getReconciliationAlerts();
            (0, response_1.sendSuccess)(res, alerts, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async resolveAlert(req, res, next) {
        try {
            const id = String(req.params.id);
            const notes = (req.body && req.body.notes) ? String(req.body.notes) : undefined;
            const alert = await billing_service_1.billingService.resolveAlert(id, notes);
            (0, response_1.sendSuccess)(res, alert, 200, 'Reconciliation alert resolved.');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.BillingController = BillingController;
exports.billingController = new BillingController();
//# sourceMappingURL=billing.controller.js.map