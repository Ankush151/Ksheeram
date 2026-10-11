"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const contracts_1 = require("@ksheeraam/contracts");
const orders_controller_1 = require("./orders.controller");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
exports.ordersRouter = (0, express_1.Router)();
const quoteSchema = zod_1.z.object({
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        variantId: zod_1.z.string().optional(),
        size: zod_1.z.nativeEnum(contracts_1.PackageSize).optional().default(contracts_1.PackageSize.L_1),
        packagingType: zod_1.z.nativeEnum(contracts_1.PackagingType).optional(),
        quantity: zod_1.z.number().int().positive(),
    }))
        .min(1),
    addressId: zod_1.z.string().optional(),
    couponCode: zod_1.z.string().optional(),
});
const createOrderSchema = zod_1.z
    .object({
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        variantId: zod_1.z.string().optional(),
        size: zod_1.z.nativeEnum(contracts_1.PackageSize).optional().default(contracts_1.PackageSize.L_1),
        packagingType: zod_1.z.nativeEnum(contracts_1.PackagingType).optional(),
        quantity: zod_1.z.number().int().positive(),
    }))
        .min(1),
    addressId: zod_1.z.string().optional(),
    deliveryAddressId: zod_1.z.string().optional(),
    deliveryDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    deliverySlot: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.string(),
    instructions: zod_1.z.string().optional(),
    deliveryInstructions: zod_1.z.string().optional(),
    idempotencyKey: zod_1.z.string().optional(),
})
    .transform((data) => {
    let pm = contracts_1.PaymentMethod.WALLET;
    const pmLower = data.paymentMethod.toLowerCase();
    if (pmLower.includes('cod') || pmLower.includes('cash'))
        pm = contracts_1.PaymentMethod.COD;
    else if (pmLower.includes('upi'))
        pm = contracts_1.PaymentMethod.UPI;
    else if (pmLower.includes('card'))
        pm = contracts_1.PaymentMethod.CARD;
    else if (pmLower.includes('wallet'))
        pm = contracts_1.PaymentMethod.WALLET;
    return {
        items: data.items,
        addressId: data.addressId || data.deliveryAddressId || '',
        deliveryDate: data.deliveryDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        deliverySlot: data.deliverySlot || 'Morning 5:30 AM - 7:00 AM',
        paymentMethod: pm,
        instructions: data.instructions || data.deliveryInstructions,
        idempotencyKey: data.idempotencyKey,
    };
});
exports.ordersRouter.post('/quote', auth_1.authenticate, (0, validation_1.validate)({ body: quoteSchema }), orders_controller_1.ordersController.quote);
exports.ordersRouter.post('/', auth_1.authenticate, (0, validation_1.validate)({ body: createOrderSchema }), orders_controller_1.ordersController.create);
exports.ordersRouter.get('/', auth_1.authenticate, orders_controller_1.ordersController.list);
exports.ordersRouter.get('/:id', auth_1.authenticate, orders_controller_1.ordersController.getById);
// Stock allocation for orders (Admin-only)
exports.ordersRouter.post('/:id/allocate-stock', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), orders_controller_1.ordersController.allocateStock);
exports.ordersRouter.post('/:id/allocate', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), orders_controller_1.ordersController.allocateStock);
// Admin-only order generator run
exports.ordersRouter.post('/generate-daily', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), orders_controller_1.ordersController.triggerGeneration);
//# sourceMappingURL=orders.routes.js.map