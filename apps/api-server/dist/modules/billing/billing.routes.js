"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const contracts_1 = require("@ksheeraam/contracts");
const billing_controller_1 = require("./billing.controller");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
exports.billingRouter = (0, express_1.Router)();
const topupSchema = zod_1.z.object({
    amountPaise: zod_1.z.number().int().positive(),
    paymentMethod: zod_1.z.nativeEnum(contracts_1.PaymentMethod).optional(),
    idempotencyKey: zod_1.z.string().optional(),
});
exports.billingRouter.get('/invoices', auth_1.authenticate, billing_controller_1.billingController.listInvoices);
exports.billingRouter.get('/invoices/:id', auth_1.authenticate, billing_controller_1.billingController.getInvoiceById);
exports.billingRouter.post('/invoices/order/:orderId', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), billing_controller_1.billingController.createInvoiceForOrder);
exports.billingRouter.get('/ledger', auth_1.authenticate, billing_controller_1.billingController.listLedger);
exports.billingRouter.post('/topup', auth_1.authenticate, (0, validation_1.validate)({ body: topupSchema }), billing_controller_1.billingController.topupWallet);
// Webhook endpoint (unauthenticated, secured via HMAC signature header)
exports.billingRouter.post('/webhook', billing_controller_1.billingController.handleWebhook);
// Admin reconciliation alerts
exports.billingRouter.get('/alerts', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), billing_controller_1.billingController.listAlerts);
exports.billingRouter.get('/reconciliations', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), billing_controller_1.billingController.listAlerts);
exports.billingRouter.post('/alerts/:id/resolve', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), billing_controller_1.billingController.resolveAlert);
exports.billingRouter.post('/reconciliations/:id/resolve', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), billing_controller_1.billingController.resolveAlert);
//# sourceMappingURL=billing.routes.js.map