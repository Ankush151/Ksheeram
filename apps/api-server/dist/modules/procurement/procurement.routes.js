"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.procurementRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const contracts_1 = require("@ksheeraam/contracts");
const procurement_controller_1 = require("./procurement.controller");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
exports.procurementRouter = (0, express_1.Router)();
const createPOSchema = zod_1.z.object({
    supplierId: zod_1.z.string().min(1),
    expectedDeliveryDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        productName: zod_1.z.string().min(1),
        size: zod_1.z.nativeEnum(contracts_1.PackageSize),
        packagingType: zod_1.z.nativeEnum(contracts_1.PackagingType),
        orderedUnits: zod_1.z.number().int().positive(),
        unitCostPaise: zod_1.z.number().int().positive(),
    }))
        .min(1),
    notes: zod_1.z.string().optional(),
});
const receiveStockSchema = zod_1.z.object({
    poId: zod_1.z.string().min(1),
    chillingTemp: zod_1.z.string().min(1),
    qualityTesterName: zod_1.z.string().min(2),
    items: zod_1.z
        .array(zod_1.z.object({
        itemId: zod_1.z.string().min(1),
        receivedUnits: zod_1.z.number().int().min(0),
        rejectedUnits: zod_1.z.number().int().min(0),
        rejectionReason: zod_1.z.string().optional(),
    }))
        .min(1),
});
exports.procurementRouter.get('/', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), procurement_controller_1.procurementController.list);
exports.procurementRouter.get('/orders', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), procurement_controller_1.procurementController.list);
exports.procurementRouter.get('/:id', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), procurement_controller_1.procurementController.getById);
exports.procurementRouter.post('/', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), (0, validation_1.validate)({ body: createPOSchema }), procurement_controller_1.procurementController.create);
exports.procurementRouter.post('/orders', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), (0, validation_1.validate)({ body: createPOSchema }), procurement_controller_1.procurementController.create);
exports.procurementRouter.post('/receive', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), (0, validation_1.validate)({ body: receiveStockSchema }), procurement_controller_1.procurementController.receiveStock);
//# sourceMappingURL=procurement.routes.js.map