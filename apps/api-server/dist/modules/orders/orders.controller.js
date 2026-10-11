"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersController = exports.OrdersController = void 0;
const orders_service_1 = require("./orders.service");
const order_generator_service_1 = require("../order-generator/order-generator.service");
const response_1 = require("../../utils/response");
class OrdersController {
    async quote(req, res, next) {
        try {
            const quote = await orders_service_1.ordersService.getCheckoutQuote(req.user.id, req.body.items);
            (0, response_1.sendSuccess)(res, quote, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const order = await orders_service_1.ordersService.createOneTimeOrder(req.user.id, req.body);
            (0, response_1.sendSuccess)(res, order, 201, 'Order placed successfully.');
        }
        catch (err) {
            next(err);
        }
    }
    async list(req, res, next) {
        try {
            const filters = {
                customerId: req.query.customerId,
                deliveryDate: req.query.deliveryDate,
                status: req.query.status,
                assignedAgentId: req.query.assignedAgentId,
            };
            const orders = await orders_service_1.ordersService.listOrders(req.user.id, req.user.role, filters);
            (0, response_1.sendSuccess)(res, orders, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async getById(req, res, next) {
        try {
            const id = String(req.params.id);
            const order = await orders_service_1.ordersService.getOrderById(id, req.user.id, req.user.role);
            (0, response_1.sendSuccess)(res, order, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async triggerGeneration(req, res, next) {
        try {
            const targetDate = req.body.targetDate;
            const result = await order_generator_service_1.orderGeneratorService.generateOrdersForDate(targetDate);
            (0, response_1.sendSuccess)(res, result, 200, 'Scheduled order generation completed.');
        }
        catch (err) {
            next(err);
        }
    }
    async allocateStock(req, res, next) {
        try {
            const id = String(req.params.id);
            const order = await orders_service_1.ordersService.allocateStockForOrder(id);
            (0, response_1.sendSuccess)(res, order, 200, 'Stock allocated to order.');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.OrdersController = OrdersController;
exports.ordersController = new OrdersController();
//# sourceMappingURL=orders.controller.js.map