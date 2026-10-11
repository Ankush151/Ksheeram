"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const contracts_1 = require("@ksheeraam/contracts");
const auth_1 = require("../../middleware/auth");
const reports_controller_1 = require("../reports/reports.controller");
const inventory_routes_1 = require("../inventory/inventory.routes");
const orders_routes_1 = require("../orders/orders.routes");
const delivery_routes_1 = require("../delivery/delivery.routes");
const procurement_routes_1 = require("../procurement/procurement.routes");
const suppliers_routes_1 = require("../suppliers/suppliers.routes");
const products_routes_1 = require("../products/products.routes");
const whatsapp_routes_1 = require("../whatsapp/whatsapp.routes");
const subscriptions_routes_1 = require("../subscriptions/subscriptions.routes");
const users_routes_1 = require("../users/users.routes");
const billing_routes_1 = require("../billing/billing.routes");
const reports_routes_1 = require("../reports/reports.routes");
exports.adminRouter = (0, express_1.Router)();
// Dashboard stats endpoint for operations management
exports.adminRouter.get('/dashboard/stats', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), reports_controller_1.reportsController.getDashboardStats);
// Mount core business modules under /api/v1/admin/*
exports.adminRouter.use('/inventory', inventory_routes_1.inventoryRouter);
exports.adminRouter.use('/orders', orders_routes_1.ordersRouter);
exports.adminRouter.use('/delivery', delivery_routes_1.deliveryRouter);
exports.adminRouter.use('/procurement', procurement_routes_1.procurementRouter);
exports.adminRouter.use('/suppliers', suppliers_routes_1.suppliersRouter);
exports.adminRouter.use('/products', products_routes_1.productsRouter);
exports.adminRouter.use('/whatsapp', whatsapp_routes_1.whatsAppRouter);
exports.adminRouter.use('/subscriptions', subscriptions_routes_1.subscriptionsRouter);
exports.adminRouter.use('/customers', users_routes_1.usersRouter);
exports.adminRouter.use('/billing', billing_routes_1.billingRouter);
exports.adminRouter.use('/reports', reports_routes_1.reportsRouter);
//# sourceMappingURL=admin.routes.js.map