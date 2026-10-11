export type PackageSize = '500ml' | '1L';

export type PackagingType = 'glass_bottle' | 'eco_pouch';

export interface ProductVariant {
  id: string;
  size: PackageSize;
  price: number;
  mrp: number;
  unit: string;
  inStock: boolean;
  packagingType: PackagingType;
}

export type ProductCategory = 'cow_milk' | 'buffalo_milk' | 'a2_milk' | 'ghee' | 'paneer' | 'curd';

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: ProductCategory;
  fatContent: string;
  snfContent: string;
  shelfLife: string;
  coldChainTemp: string;
  imageUrl: string;
  benefits: string[];
  variants: ProductVariant[];
  isAvailableForSubscription: boolean;
  isAvailableForOneTime: boolean;
  isBestSeller?: boolean;
}

export interface ProductsFilter {
  category?: string;
  search?: string;
}
