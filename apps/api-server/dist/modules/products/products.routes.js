"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const contracts_1 = require("@ksheeraam/contracts");
const products_controller_1 = require("./products.controller");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
exports.productsRouter = (0, express_1.Router)();
const createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    slug: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    category: zod_1.z.nativeEnum(contracts_1.MilkCategory),
    fatContent: zod_1.z.string(),
    snfContent: zod_1.z.string(),
    coldChainTemp: zod_1.z.string().optional().default('4°C'),
    shelfLife: zod_1.z.string().optional().default('48 hours'),
    imageUrl: zod_1.z.string().min(1),
    isActive: zod_1.z.boolean().optional(),
    variants: zod_1.z
        .array(zod_1.z.object({
        size: zod_1.z.nativeEnum(contracts_1.PackageSize),
        packagingType: zod_1.z.nativeEnum(contracts_1.PackagingType),
        pricePaise: zod_1.z.number().int().positive(),
        mrpPaise: zod_1.z.number().int().positive(),
    }))
        .min(1),
});
exports.productsRouter.get('/', products_controller_1.productsController.list);
exports.productsRouter.get('/:id', products_controller_1.productsController.getById);
exports.productsRouter.get('/slug/:slug', products_controller_1.productsController.getBySlug);
// Admin-only creation & editing
exports.productsRouter.post('/', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), (0, validation_1.validate)({ body: createProductSchema }), products_controller_1.productsController.create);
exports.productsRouter.put('/:id', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), products_controller_1.productsController.update);
//# sourceMappingURL=products.routes.js.map