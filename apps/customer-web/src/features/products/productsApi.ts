import { apiClient } from '@/services/api-client';
import { mockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import { Product } from '@/types/products';

function mapProduct(dto: any): Product {
  const variants = (dto.variants || []).map((v: any) => ({
    id: v.id || v._id,
    size: v.size,
    price: v.pricePaise !== undefined ? v.pricePaise / 100 : (v.price || 68),
    mrp: v.mrpPaise !== undefined ? v.mrpPaise / 100 : (v.mrp || 72),
    unit: v.size === '1L' ? '1 L' : '500 ml',
    inStock: v.inStock ?? true,
    packagingType: v.packagingType || 'glass_bottle',
  }));

  return {
    id: dto.id || dto._id,
    slug: dto.slug,
    name: dto.name,
    tagline: dto.description ? (dto.description.length > 60 ? dto.description.slice(0, 57) + '...' : dto.description) : 'Pure & Natural Farm Fresh Milk',
    description: dto.description || '',
    category: dto.category,
    fatContent: dto.fatContent || '4.0% Min',
    snfContent: dto.snfContent || '8.5% Min',
    shelfLife: dto.shelfLife || '48 hours from dispatch',
    coldChainTemp: dto.coldChainTemp || '4°C Strict',
    imageUrl: dto.imageUrl || '/images/products/cow-milk.png',
    benefits: [
      '100% Pure & Unadulterated milk',
      'Chilled to 4°C within 15 minutes of milking',
      'Zero hormones, antibiotics or adulterants',
      'Eco-friendly sealed sterilization packaging',
    ],
    variants,
    isAvailableForSubscription: true,
    isAvailableForOneTime: true,
    isBestSeller: true,
  };
}

export const productsApi = {
  async getProducts(category?: string, search?: string): Promise<Product[]> {
    if (env.USE_MOCK_API) {
      return mockHandlers.getProducts(category, search);
    }
    const res = await apiClient.get<any[]>('/products', { category, search });
    return (res || []).map(mapProduct);
  },

  async getProductBySlug(slug: string): Promise<Product> {
    if (env.USE_MOCK_API) {
      return mockHandlers.getProductBySlug(slug);
    }
    const res = await apiClient.get<any>(`/products/${slug}`);
    return mapProduct(res);
  },
};
