"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsController = exports.ProductsController = void 0;
const products_service_1 = require("./products.service");
const response_1 = require("../../utils/response");
class ProductsController {
    async list(req, res, next) {
        try {
            const category = req.query.category;
            const search = req.query.search;
            const activeOnly = req.query.all === 'true' ? false : true;
            const products = await products_service_1.productsService.listProducts({ category, search, activeOnly });
            (0, response_1.sendSuccess)(res, products, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async getById(req, res, next) {
        try {
            const id = String(req.params.id);
            const product = await products_service_1.productsService.getProductById(id);
            (0, response_1.sendSuccess)(res, product, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async getBySlug(req, res, next) {
        try {
            const slug = String(req.params.slug);
            const product = await products_service_1.productsService.getProductBySlug(slug);
            (0, response_1.sendSuccess)(res, product, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const product = await products_service_1.productsService.createProduct(req.body);
            (0, response_1.sendSuccess)(res, product, 201, 'Product created successfully.');
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const id = String(req.params.id);
            const product = await products_service_1.productsService.updateProduct(id, req.body);
            (0, response_1.sendSuccess)(res, product, 200, 'Product updated successfully.');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ProductsController = ProductsController;
exports.productsController = new ProductsController();
//# sourceMappingURL=products.controller.js.map