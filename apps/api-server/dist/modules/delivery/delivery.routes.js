"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const contracts_1 = require("@ksheeraam/contracts");
const delivery_controller_1 = require("./delivery.controller");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
exports.deliveryRouter = (0, express_1.Router)();
const assignSchema = zod_1.z.object({
    orderIds: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    agentId: zod_1.z.string().min(1),
});
const completeSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1),
    cashCollectedPaise: zod_1.z.number().int().min(0).optional(),
    agentNotes: zod_1.z.string().optional(),
});
const failSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1),
    reason: zod_1.z.nativeEnum(contracts_1.DeliveryFailureReason),
    notes: zod_1.z.string().optional(),
});
// Manifest query accessible to admins and delivery agents
exports.deliveryRouter.get('/manifest', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN, contracts_1.Role.DELIVERY_AGENT), delivery_controller_1.deliveryController.getManifest);
exports.deliveryRouter.get('/agents', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), delivery_controller_1.deliveryController.listAgents);
exports.deliveryRouter.get('/agent/:agentId/manifest', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN, contracts_1.Role.DELIVERY_AGENT), delivery_controller_1.deliveryController.getAgentManifest);
// Admin-only route to assign agents
exports.deliveryRouter.post('/assign', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), (0, validation_1.validate)({ body: assignSchema }), delivery_controller_1.deliveryController.assign);
// Delivery agent & Admin completion / failure routes
exports.deliveryRouter.post('/complete', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN, contracts_1.Role.DELIVERY_AGENT), (0, validation_1.validate)({ body: completeSchema }), delivery_controller_1.deliveryController.complete);
exports.deliveryRouter.post('/fail', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN, contracts_1.Role.DELIVERY_AGENT), (0, validation_1.validate)({ body: failSchema }), delivery_controller_1.deliveryController.fail);
//# sourceMappingURL=delivery.routes.js.map