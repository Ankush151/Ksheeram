"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsAppRouter = void 0;
const express_1 = require("express");
const contracts_1 = require("@ksheeraam/contracts");
const whatsapp_controller_1 = require("./whatsapp.controller");
const auth_1 = require("../../middleware/auth");
exports.whatsAppRouter = (0, express_1.Router)();
// Public Meta webhook endpoints
exports.whatsAppRouter.get('/webhook', whatsapp_controller_1.whatsAppController.verify);
exports.whatsAppRouter.post('/webhook', whatsapp_controller_1.whatsAppController.handleInbound);
// Admin-assisted inbox routes
exports.whatsAppRouter.get('/messages', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), whatsapp_controller_1.whatsAppController.list);
exports.whatsAppRouter.get('/requests', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), whatsapp_controller_1.whatsAppController.list);
exports.whatsAppRouter.patch('/requests/:id/status', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), whatsapp_controller_1.whatsAppController.updateStatus);
exports.whatsAppRouter.post('/messages/:id/convert', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), whatsapp_controller_1.whatsAppController.convertToOrder);
exports.whatsAppRouter.post('/messages/:id/dismiss', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), whatsapp_controller_1.whatsAppController.dismiss);
//# sourceMappingURL=whatsapp.routes.js.map