"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suppliersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const contracts_1 = require("@ksheeraam/contracts");
const suppliers_controller_1 = require("./suppliers.controller");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
exports.suppliersRouter = (0, express_1.Router)();
const createSupplierSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    contactPerson: zod_1.z.string().min(2),
    phone: zod_1.z.string().min(10),
    email: zod_1.z.string().email().optional(),
    villageDistrict: zod_1.z.string().min(2),
    state: zod_1.z.string().optional(),
    milkTypes: zod_1.z.array(zod_1.z.string()).min(1),
    dailySupplyCapacityUnits: zod_1.z.number().int().positive(),
    paymentTerms: zod_1.z.string().optional(),
    status: zod_1.z.enum(['active', 'inactive']).optional(),
});
exports.suppliersRouter.get('/', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), suppliers_controller_1.suppliersController.list);
exports.suppliersRouter.get('/:id', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), suppliers_controller_1.suppliersController.getById);
exports.suppliersRouter.post('/', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), (0, validation_1.validate)({ body: createSupplierSchema }), suppliers_controller_1.suppliersController.create);
exports.suppliersRouter.put('/:id', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), suppliers_controller_1.suppliersController.update);
//# sourceMappingURL=suppliers.routes.js.map