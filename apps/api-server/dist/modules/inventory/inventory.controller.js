"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryController = exports.InventoryController = void 0;
const inventory_service_1 = require("./inventory.service");
const response_1 = require("../../utils/response");
class InventoryController {
    async listBalances(req, res, next) {
        try {
            const balances = await inventory_service_1.inventoryService.listBalances();
            (0, response_1.sendSuccess)(res, balances, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async listMovements(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
            const movements = await inventory_service_1.inventoryService.listMovements(limit);
            (0, response_1.sendSuccess)(res, movements, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async adjustStock(req, res, next) {
        try {
            const { inventoryId, adjustmentType, units, reason } = req.body;
            const balance = await inventory_service_1.inventoryService.adjustStock(inventoryId, adjustmentType, units, reason, req.user?.name || 'ADMIN');
            (0, response_1.sendSuccess)(res, balance, 200, 'Inventory stock adjusted successfully.');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.InventoryController = InventoryController;
exports.inventoryController = new InventoryController();
//# sourceMappingURL=inventory.controller.js.map