import mongoose from 'mongoose';
import { CreateProductDto, MilkCategory, ProductDto, ProductVariantDto } from '@ksheeraam/contracts';
import { IProduct, ProductModel } from '../../models/Product';
import { NotFoundError } from '../../utils/errors';

export function mapProductToDto(p: IProduct): ProductDto {
  const variants: ProductVariantDto[] = p.variants.map((v) => ({
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

export class ProductsService {
  async listProducts(filters?: { category?: MilkCategory; search?: string; activeOnly?: boolean }): Promise<ProductDto[]> {
    const query: any = {};
    if (filters?.category) query.category = filters.category;
    if (filters?.activeOnly !== false) query.isActive = true;

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

    const products = await ProductModel.find(query).sort({ category: 1, name: 1 });
    return products.map(mapProductToDto);
  }

  async getProductById(id: string): Promise<ProductDto> {
    let product = null;
    if (mongoose.isValidObjectId(id)) {
      product = await ProductModel.findById(id);
    }
    if (!product) {
      product = await ProductModel.findOne({ slug: id });
    }
    if (!product) throw new NotFoundError(`Product '${id}' not found.`);
    return mapProductToDto(product);
  }

  async getProductBySlug(slug: string): Promise<ProductDto> {
    const product = await ProductModel.findOne({ slug });
    if (!product) throw new NotFoundError(`Product with slug '${slug}' not found.`);
    return mapProductToDto(product);
  }

  async createProduct(data: CreateProductDto): Promise<ProductDto> {
    const product = await ProductModel.create({
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

  async updateProduct(id: string, data: Partial<CreateProductDto>): Promise<ProductDto> {
    const product = await ProductModel.findById(id);
    if (!product) throw new NotFoundError('Product not found.');

    if (data.name) product.name = data.name;
    if (data.slug) product.slug = data.slug;
    if (data.description !== undefined) product.description = data.description;
    if (data.category) product.category = data.category;
    if (data.fatContent) product.fatContent = data.fatContent;
    if (data.snfContent) product.snfContent = data.snfContent;
    if (data.coldChainTemp) product.coldChainTemp = data.coldChainTemp;
    if (data.shelfLife) product.shelfLife = data.shelfLife;
    if (data.imageUrl) product.imageUrl = data.imageUrl;
    if (data.isActive !== undefined) product.isActive = data.isActive;

    if (data.variants) {
      product.variants = data.variants.map((v) => ({
        size: v.size,
        packagingType: v.packagingType,
        pricePaise: Math.round(v.pricePaise),
        mrpPaise: Math.round(v.mrpPaise),
        inStock: true,
        saleableUnits: 100,
      })) as any;
    }

    await product.save();
    return mapProductToDto(product);
  }
}

export const productsService = new ProductsService();
