import { adminApiClient } from '@/services/api-client';
import { env } from '@/config/env';
import { AdminProduct } from '@/types/products';

function mapAdminProduct(p: any): AdminProduct {
  const variants = (p.variants || []).map((v: any) => ({
    id: v.id || v._id,
    size: v.size,
    price: v.pricePaise !== undefined ? v.pricePaise / 100 : (v.price || 68),
    mrp: v.mrpPaise !== undefined ? v.mrpPaise / 100 : (v.mrp || 72),
    packagingType: v.packagingType,
    inStock: v.inStock ?? true,
    saleableUnits: v.saleableUnits ?? 100,
  }));

  return {
    id: p.id || p._id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    fatContent: p.fatContent,
    snfContent: p.snfContent,
    coldChainTemp: p.coldChainTemp,
    shelfLife: p.shelfLife,
    imageUrl: p.imageUrl,
    isActive: p.isActive,
    variants,
  };
}

export const productsApi = {
  async getProducts(): Promise<AdminProduct[]> {
    if (env.USE_MOCK_API) {
      // return formatted products
      return [
        {
          id: 'prod_cow_milk',
          name: 'Farm Fresh Cow Milk',
          slug: 'farm-fresh-cow-milk',
          category: 'cow_milk',
          fatContent: '3.8% Min',
          snfContent: '8.5% Min',
          coldChainTemp: 'Strict 4°C',
          shelfLife: '48 Hours',
          imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
          isActive: true,
          variants: [
            { id: 'v1', size: '500ml', price: 38, mrp: 42, packagingType: 'eco_pouch', inStock: true, saleableUnits: 310 },
            { id: 'v2', size: '1L', price: 72, mrp: 80, packagingType: 'glass_bottle', inStock: true, saleableUnits: 420 },
          ],
        },
        {
          id: 'prod_a2_milk',
          name: 'Desi Gir Cow A2 Milk',
          slug: 'desi-gir-cow-a2-milk',
          category: 'a2_milk',
          fatContent: '4.2% Min',
          snfContent: '8.8% Min',
          coldChainTemp: 'Strict 4°C',
          shelfLife: '48 Hours',
          imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=400&q=80',
          isActive: true,
          variants: [
            { id: 'v3', size: '500ml', price: 52, mrp: 58, packagingType: 'eco_pouch', inStock: true, saleableUnits: 180 },
            { id: 'v4', size: '1L', price: 98, mrp: 110, packagingType: 'glass_bottle', inStock: true, saleableUnits: 280 },
          ],
        },
        {
          id: 'prod_buffalo_milk',
          name: 'Creamy Rich Buffalo Milk',
          slug: 'creamy-rich-buffalo-milk',
          category: 'buffalo_milk',
          fatContent: '6.8% Min',
          snfContent: '9.2% Min',
          coldChainTemp: 'Strict 4°C',
          shelfLife: '48 Hours',
          imageUrl: 'https://images.unsplash.com/photo-1568651318047-9831969e712a?auto=format&fit=crop&w=400&q=80',
          isActive: true,
          variants: [
            { id: 'v5', size: '500ml', price: 45, mrp: 50, packagingType: 'eco_pouch', inStock: true, saleableUnits: 190 },
            { id: 'v6', size: '1L', price: 88, mrp: 96, packagingType: 'glass_bottle', inStock: true, saleableUnits: 190 },
          ],
        },
        {
          id: 'prod_bilona_ghee',
          name: 'Vedic Bilona Cow Ghee',
          slug: 'vedic-bilona-cow-ghee',
          category: 'ghee',
          fatContent: '99.8% Pure Milk Fat',
          snfContent: 'N/A',
          coldChainTemp: 'Ambient cool',
          shelfLife: '9 Months',
          imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
          isActive: true,
          variants: [
            { id: 'v7', size: '500ml', price: 650, mrp: 720, packagingType: 'glass_bottle', inStock: true, saleableUnits: 95 },
          ],
        },
      ];
    }
    const res = await adminApiClient.get<any[]>('/admin/products');
    return (res || []).map(mapAdminProduct);
  },
};
