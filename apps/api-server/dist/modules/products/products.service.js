"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsService = exports.ProductsService = void 0;
exports.mapProductToDto = mapProductToDto;
const mongoose_1 = __importDefault(require("mongoose"));
const Product_1 = require("../../models/Product");
const errors_1 = require("../../utils/errors");
function mapProductToDto(p) {
    const variants = p.variants.map((v) => ({
        id: v._id ? v._id.toString() : '',
        size: v.size,
        packagingType: v.packagingType,
        pricePaise: v.pricePaise,
        mrpPaise: v.mrpPaise,
        inStock: v.inStock,
        saleableUnits: v.saleableUnits,
    }));
    return {
        id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: p.category,
        fatContent: p.fatContent,
        snfContent: p.snfContent,
        coldChainTemp: p.coldChainTemp,
        shelfLife: p.shelfLife,
        imageUrl: p.imageUrl,
        isActive: p.isActive,
        variants,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
    };
}
class ProductsService {
    async listProducts(filters) {
        const query = {};
        if (filters?.category)
            query.category = filters.category;
        if (filters?.activeOnly !== false)
            query.isActive = true;
        if (filters?.search && filters.search.trim()) {
            const escaped = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const searchRegex = new RegExp(escaped, 'i');
            query.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { slug: searchRegex },
                { category: searchRegex },
            ];
        }
        const products = await Product_1.ProductModel.find(query).sort({ category: 1, name: 1 });
        return products.map(mapProductToDto);
    }
    async getProductById(id) {
        let product = null;
        if (mongoose_1.default.isValidObjectId(id)) {
            product = await Product_1.ProductModel.findById(id);
        }
        if (!product) {
            product = await Product_1.ProductModel.findOne({ slug: id });
        }
        if (!product)
            throw new errors_1.NotFoundError(`Product '${id}' not found.`);
        return mapProductToDto(product);
    }
    async getProductBySlug(slug) {
        const product = await Product_1.ProductModel.findOne({ slug });
        if (!product)
            throw new errors_1.NotFoundError(`Product with slug '${slug}' not found.`);
        return mapProductToDto(product);
    }
    async createProduct(data) {
        const product = await Product_1.ProductModel.create({
            name: data.name,
            slug: data.slug,
            description: data.description,
            category: data.category,
            fatContent: data.fatContent,
            snfContent: data.snfContent,
            coldChainTemp: data.coldChainTemp,
            shelfLife: data.shelfLife,
            imageUrl: data.imageUrl,
            isActive: data.isActive !== false,
            variants: data.variants.map((v) => ({
                size: v.size,
                packagingType: v.packagingType,
                pricePaise: Math.round(v.pricePaise),
                mrpPaise: Math.round(v.mrpPaise),
                inStock: true,
                saleableUnits: 100,
            })),
        });
        return mapProductToDto(product);
    }
    async updateProduct(id, data) {
        const product = await Product_1.ProductModel.findById(id);
        if (!product)
            throw new errors_1.NotFoundError('Product not found.');
        if (data.name)
            product.name = data.name;
        if (data.slug)
            product.slug = data.slug;
        if (data.description !== undefined)
            product.description = data.description;
        if (data.category)
            product.category = data.category;
        if (data.fatContent)
            product.fatContent = data.fatContent;
        if (data.snfContent)
            product.snfContent = data.snfContent;
        if (data.coldChainTemp)
            product.coldChainTemp = data.coldChainTemp;
        if (data.shelfLife)
            product.shelfLife = data.shelfLife;
        if (data.imageUrl)
            product.imageUrl = data.imageUrl;
        if (data.isActive !== undefined)
            product.isActive = data.isActive;
        if (data.variants) {
            product.variants = data.variants.map((v) => ({
                size: v.size,
                packagingType: v.packagingType,
                pricePaise: Math.round(v.pricePaise),
                mrpPaise: Math.round(v.mrpPaise),
                inStock: true,
                saleableUnits: 100,
            }));
        }
        await product.save();
        return mapProductToDto(product);
    }
}
exports.ProductsService = ProductsService;
exports.productsService = new ProductsService();
//# sourceMappingURL=products.service.js.map