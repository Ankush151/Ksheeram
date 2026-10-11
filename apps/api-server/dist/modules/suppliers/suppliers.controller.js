"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suppliersController = exports.SuppliersController = void 0;
const suppliers_service_1 = require("./suppliers.service");
const response_1 = require("../../utils/response");
class SuppliersController {
    async list(req, res, next) {
        try {
            const suppliers = await suppliers_service_1.suppliersService.listSuppliers();
            (0, response_1.sendSuccess)(res, suppliers, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async getById(req, res, next) {
        try {
            const id = String(req.params.id);
            const supplier = await suppliers_service_1.suppliersService.getSupplierById(id);
            (0, response_1.sendSuccess)(res, supplier, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const supplier = await suppliers_service_1.suppliersService.createSupplier(req.body);
            (0, response_1.sendSuccess)(res, supplier, 201, 'Supplier registered successfully.');
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const id = String(req.params.id);
            const supplier = await suppliers_service_1.suppliersService.updateSupplier(id, req.body);
            (0, response_1.sendSuccess)(res, supplier, 200, 'Supplier updated successfully.');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SuppliersController = SuppliersController;
exports.suppliersController = new SuppliersController();
//# sourceMappingURL=suppliers.controller.js.map