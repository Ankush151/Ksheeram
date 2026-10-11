"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const contracts_1 = require("@ksheeraam/contracts");
const inventory_controller_1 = require("./inventory.controller");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
exports.inventoryRouter = (0, express_1.Router)();
const adjustSchema = zod_1.z.object({
    inventoryId: zod_1.z.string().min(1),
    adjustmentType: zod_1.z.enum(['add_stock', 'mark_damaged', 'audit_adjustment']),
    units: zod_1.z.number().int().positive(),
    reason: zod_1.z.string().min(3),
});
// Admin & Delivery agents can view inventory balances
exports.inventoryRouter.get('/', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN, contracts_1.Role.DELIVERY_AGENT), inventory_controller_1.inventoryController.listBalances);
exports.inventoryRouter.get('/movements', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), inventory_controller_1.inventoryController.listMovements);
exports.inventoryRouter.get('/logs', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), inventory_controller_1.inventoryController.listMovements);
exports.inventoryRouter.post('/adjust', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), (0, validation_1.validate)({ body: adjustSchema }), inventory_controller_1.inventoryController.adjustStock);
//# sourceMappingURL=inventory.routes.js.map