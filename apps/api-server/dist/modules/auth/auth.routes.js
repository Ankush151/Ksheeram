"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const contracts_1 = require("@ksheeraam/contracts");
const auth_controller_1 = require("./auth.controller");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
exports.authRouter = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    phone: zod_1.z.string().min(10, 'Phone must be a valid 10-digit number'),
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(6).optional(),
    role: zod_1.z.nativeEnum(contracts_1.Role).optional(),
});
const loginSchema = zod_1.z.object({
    phoneOrEmail: zod_1.z.string().min(3, 'Phone or Email is required'),
    password: zod_1.z.string().optional(),
    otp: zod_1.z.string().optional(),
    role: zod_1.z.nativeEnum(contracts_1.Role).optional(),
});
const refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().optional(),
});
exports.authRouter.post('/register', (0, validation_1.validate)({ body: registerSchema }), auth_controller_1.authController.register);
exports.authRouter.post('/login', (0, validation_1.validate)({ body: loginSchema }), auth_controller_1.authController.login);
exports.authRouter.post('/admin/login', (0, validation_1.validate)({ body: loginSchema }), auth_controller_1.authController.login);
exports.authRouter.post('/refresh', (0, validation_1.validate)({ body: refreshSchema }), auth_controller_1.authController.refresh);
exports.authRouter.post('/logout', auth_controller_1.authController.logout);
exports.authRouter.get('/me', auth_1.authenticate, auth_controller_1.authController.me);
//# sourceMappingURL=auth.routes.js.map