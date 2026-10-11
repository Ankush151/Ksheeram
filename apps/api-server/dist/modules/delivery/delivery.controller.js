"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryController = exports.DeliveryController = void 0;
const contracts_1 = require("@ksheeraam/contracts");
const delivery_service_1 = require("./delivery.service");
const response_1 = require("../../utils/response");
const contracts_2 = require("@ksheeraam/contracts");
const User_1 = require("../../models/User");
const auth_service_1 = require("../auth/auth.service");
const errors_1 = require("../../utils/errors");
class DeliveryController {
    async getManifest(req, res, next) {
        try {
            const date = req.query.date || (0, contracts_2.getKolkataDateString)();
            const manifest = await delivery_service_1.deliveryService.getDailyManifest(date, req.user.id, req.user.role);
            (0, response_1.sendSuccess)(res, manifest, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async getAgentManifest(req, res, next) {
        try {
            const agentId = String(req.params.agentId || req.user.id);
            if (req.user.role === contracts_1.Role.DELIVERY_AGENT && agentId !== req.user.id) {
                throw new errors_1.ForbiddenError('You can only view your own delivery manifest.');
            }
            const date = req.query.date || (0, contracts_2.getKolkataDateString)();
            const manifest = await delivery_service_1.deliveryService.getDailyManifest(date, agentId, req.user.role);
            (0, response_1.sendSuccess)(res, manifest, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async listAgents(req, res, next) {
        try {
            const agents = await User_1.UserModel.find({ role: contracts_1.Role.DELIVERY_AGENT, isActive: true });
            (0, response_1.sendSuccess)(res, agents.map(auth_service_1.mapUserToDto), 200);
        }
        catch (err) {
            next(err);
        }
    }
    async assign(req, res, next) {
        try {
            const result = await delivery_service_1.deliveryService.assignAgent(req.body);
            (0, response_1.sendSuccess)(res, result, 200, 'Orders assigned to delivery agent.');
        }
        catch (err) {
            next(err);
        }
    }
    async complete(req, res, next) {
        try {
            const item = await delivery_service_1.deliveryService.completeDelivery(req.body, req.user.id, req.user.role);
            (0, response_1.sendSuccess)(res, item, 200, 'Delivery confirmed as completed.');
        }
        catch (err) {
            next(err);
        }
    }
    async fail(req, res, next) {
        try {
            const item = await delivery_service_1.deliveryService.failDelivery(req.body, req.user.id, req.user.role);
            (0, response_1.sendSuccess)(res, item, 200, 'Delivery marked as failed.');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.DeliveryController = DeliveryController;
exports.deliveryController = new DeliveryController();
//# sourceMappingURL=delivery.controller.js.map