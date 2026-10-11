"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionsController = exports.SubscriptionsController = void 0;
const subscriptions_service_1 = require("./subscriptions.service");
const response_1 = require("../../utils/response");
class SubscriptionsController {
    async list(req, res, next) {
        try {
            const customerId = req.query.customerId;
            const subs = await subscriptions_service_1.subscriptionsService.listSubscriptions(req.user.id, req.user.role, customerId);
            (0, response_1.sendSuccess)(res, subs, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async getById(req, res, next) {
        try {
            const id = String(req.params.id);
            const sub = await subscriptions_service_1.subscriptionsService.getSubscriptionById(id, req.user.id, req.user.role);
            (0, response_1.sendSuccess)(res, sub, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const sub = await subscriptions_service_1.subscriptionsService.createSubscription(req.user.id, req.body);
            (0, response_1.sendSuccess)(res, sub, 201, 'Recurring subscription activated successfully.');
        }
        catch (err) {
            next(err);
        }
    }
    async pause(req, res, next) {
        try {
            const id = String(req.params.id);
            const sub = await subscriptions_service_1.subscriptionsService.pauseSubscription(id, req.user.id, req.user.role, req.body);
            (0, response_1.sendSuccess)(res, sub, 200, 'Subscription delivery paused.');
        }
        catch (err) {
            next(err);
        }
    }
    async resume(req, res, next) {
        try {
            const id = String(req.params.id);
            const sub = await subscriptions_service_1.subscriptionsService.resumeSubscription(id, req.user.id, req.user.role);
            (0, response_1.sendSuccess)(res, sub, 200, 'Subscription delivery resumed.');
        }
        catch (err) {
            next(err);
        }
    }
    async cancel(req, res, next) {
        try {
            const id = String(req.params.id);
            const sub = await subscriptions_service_1.subscriptionsService.cancelSubscription(id, req.user.id, req.user.role);
            (0, response_1.sendSuccess)(res, sub, 200, 'Subscription cancelled.');
        }
        catch (err) {
            next(err);
        }
    }
    async updateSchedule(req, res, next) {
        try {
            const id = String(req.params.id);
            const sub = await subscriptions_service_1.subscriptionsService.updateSchedule(id, req.user.id, req.user.role, req.body);
            (0, response_1.sendSuccess)(res, sub, 200, 'Subscription schedule updated.');
        }
        catch (err) {
            next(err);
        }
    }
    async quote(req, res, next) {
        try {
            const quote = await subscriptions_service_1.subscriptionsService.quoteSubscription(req.body);
            (0, response_1.sendSuccess)(res, quote, 200);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SubscriptionsController = SubscriptionsController;
exports.subscriptionsController = new SubscriptionsController();
//# sourceMappingURL=subscriptions.controller.js.map