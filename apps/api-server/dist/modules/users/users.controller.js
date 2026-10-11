"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersController = exports.UsersController = void 0;
const users_service_1 = require("./users.service");
const response_1 = require("../../utils/response");
class UsersController {
    async listUsers(req, res, next) {
        try {
            const role = req.query.role;
            const users = await users_service_1.usersService.listUsers(role);
            (0, response_1.sendSuccess)(res, users, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async getUser(req, res, next) {
        try {
            const id = String(req.params.id);
            const user = await users_service_1.usersService.getUserById(id);
            (0, response_1.sendSuccess)(res, user, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async listAddresses(req, res, next) {
        try {
            const targetUserId = req.params.userId ? String(req.params.userId) : req.user.id;
            const addresses = await users_service_1.usersService.listUserAddresses(req.user.id, targetUserId, req.user.role);
            (0, response_1.sendSuccess)(res, addresses, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async createAddress(req, res, next) {
        try {
            const address = await users_service_1.usersService.createAddress(req.user.id, req.body);
            (0, response_1.sendSuccess)(res, address, 201, 'Address added successfully.');
        }
        catch (err) {
            next(err);
        }
    }
    async updateAddress(req, res, next) {
        try {
            const id = String(req.params.id);
            const address = await users_service_1.usersService.updateAddress(id, req.user.id, req.user.role, req.body);
            (0, response_1.sendSuccess)(res, address, 200, 'Address updated successfully.');
        }
        catch (err) {
            next(err);
        }
    }
    async deleteAddress(req, res, next) {
        try {
            const id = String(req.params.id);
            await users_service_1.usersService.deleteAddress(id, req.user.id, req.user.role);
            (0, response_1.sendSuccess)(res, { deleted: true }, 200, 'Address removed successfully.');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.UsersController = UsersController;
exports.usersController = new UsersController();
//# sourceMappingURL=users.controller.js.map