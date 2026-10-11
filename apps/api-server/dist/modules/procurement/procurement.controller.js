"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.procurementController = exports.ProcurementController = void 0;
const procurement_service_1 = require("./procurement.service");
const response_1 = require("../../utils/response");
class ProcurementController {
    async list(req, res, next) {
        try {
            const pos = await procurement_service_1.procurementService.listPurchaseOrders();
            (0, response_1.sendSuccess)(res, pos, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async getById(req, res, next) {
        try {
            const id = String(req.params.id);
            const po = await procurement_service_1.procurementService.getPurchaseOrderById(id);
            (0, response_1.sendSuccess)(res, po, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const po = await procurement_service_1.procurementService.createPurchaseOrder(req.body);
            (0, response_1.sendSuccess)(res, po, 201, 'Purchase order placed successfully.');
        }
        catch (err) {
            next(err);
        }
    }
    async receiveStock(req, res, next) {
        try {
            const po = await procurement_service_1.procurementService.receiveStock(req.body, req.user?.name || 'QUALITY_TESTER');
            (0, response_1.sendSuccess)(res, po, 200, 'Stock received and inventory inwarded successfully.');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ProcurementController = ProcurementController;
exports.procurementController = new ProcurementController();
//# sourceMappingURL=procurement.controller.js.map