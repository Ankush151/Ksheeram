"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const contracts_1 = require("@ksheeraam/contracts");
const users_controller_1 = require("./users.controller");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
exports.usersRouter = (0, express_1.Router)();
const addressSchema = zod_1.z.object({
    label: zod_1.z.string().optional().default('Home'),
    flatNumber: zod_1.z.string().min(1),
    buildingName: zod_1.z.string().min(1),
    streetArea: zod_1.z.string().min(2),
    landmark: zod_1.z.string().optional(),
    city: zod_1.z.string().optional().default('Bangalore'),
    pincode: zod_1.z.string().min(6),
    isDefault: zod_1.z.boolean().optional(),
    deliveryInstructions: zod_1.z.string().optional(),
});
// Admin-only user list
exports.usersRouter.get('/', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), users_controller_1.usersController.listUsers);
exports.usersRouter.get('/:id', auth_1.authenticate, users_controller_1.usersController.getUser);
// Addresses routes
exports.usersRouter.get('/:userId/addresses', auth_1.authenticate, users_controller_1.usersController.listAddresses);
exports.usersRouter.get('/me/addresses', auth_1.authenticate, users_controller_1.usersController.listAddresses);
exports.usersRouter.post('/me/addresses', auth_1.authenticate, (0, validation_1.validate)({ body: addressSchema }), users_controller_1.usersController.createAddress);
exports.usersRouter.put('/me/addresses/:id', auth_1.authenticate, users_controller_1.usersController.updateAddress);
exports.usersRouter.delete('/me/addresses/:id', auth_1.authenticate, users_controller_1.usersController.deleteAddress);
//# sourceMappingURL=users.routes.js.map