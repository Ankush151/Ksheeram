"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const contracts_1 = require("@ksheeraam/contracts");
const subscriptions_controller_1 = require("./subscriptions.controller");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
exports.subscriptionsRouter = (0, express_1.Router)();
const createSubscriptionSchema = zod_1.z.object({
    frequency: zod_1.z.nativeEnum(contracts_1.SubscriptionFrequency),
    customDays: zod_1.z.array(zod_1.z.number().min(0).max(6)).optional(),
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        variantId: zod_1.z.string().optional(),
        size: zod_1.z.nativeEnum(contracts_1.PackageSize).optional().default(contracts_1.PackageSize.L_1),
        quantity: zod_1.z.number().int().positive(),
    }))
        .min(1),
    addressId: zod_1.z.string().optional(),
    deliveryAddressId: zod_1.z.string().optional(),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    deliverySlot: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.string().optional(),
}).transform((data) => ({
    ...data,
    addressId: data.addressId || data.deliveryAddressId || '',
    startDate: data.startDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
}));
const pauseSchema = zod_1.z.object({
    pauseStartDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    pauseEndDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    reason: zod_1.z.string().optional(),
}).transform((data) => {
    const tomorrow = new Date(Date.now() + 86400000);
    const nextWeek = new Date(Date.now() + 8 * 86400000);
    return {
        ...data,
        pauseStartDate: data.pauseStartDate || tomorrow.toISOString().split('T')[0],
        pauseEndDate: data.pauseEndDate || nextWeek.toISOString().split('T')[0],
    };
});
const updateScheduleSchema = zod_1.z.object({
    frequency: zod_1.z.nativeEnum(contracts_1.SubscriptionFrequency).optional(),
    customDays: zod_1.z.array(zod_1.z.number().min(0).max(6)).optional(),
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        size: zod_1.z.nativeEnum(contracts_1.PackageSize),
        quantity: zod_1.z.number().int().positive(),
    }))
        .optional(),
    effectiveFromDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
exports.subscriptionsRouter.get('/', auth_1.authenticate, subscriptions_controller_1.subscriptionsController.list);
exports.subscriptionsRouter.post('/quote', subscriptions_controller_1.subscriptionsController.quote);
exports.subscriptionsRouter.get('/:id', auth_1.authenticate, subscriptions_controller_1.subscriptionsController.getById);
exports.subscriptionsRouter.post('/', auth_1.authenticate, (0, validation_1.validate)({ body: createSubscriptionSchema }), subscriptions_controller_1.subscriptionsController.create);
exports.subscriptionsRouter.post('/:id/pause', auth_1.authenticate, (0, validation_1.validate)({ body: pauseSchema }), subscriptions_controller_1.subscriptionsController.pause);
exports.subscriptionsRouter.post('/:id/resume', auth_1.authenticate, subscriptions_controller_1.subscriptionsController.resume);
exports.subscriptionsRouter.post('/:id/cancel', auth_1.authenticate, subscriptions_controller_1.subscriptionsController.cancel);
exports.subscriptionsRouter.put('/:id/schedule', auth_1.authenticate, (0, validation_1.validate)({ body: updateScheduleSchema }), subscriptions_controller_1.subscriptionsController.updateSchedule);
//# sourceMappingURL=subscriptions.routes.js.map