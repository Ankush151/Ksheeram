export type PackageSize = '500ml' | '1L';

export interface AdminProductVariant {
  id: string;
  size: PackageSize;
  price: number;
  mrp: number;
  packagingType: 'glass_bottle' | 'eco_pouch';
  inStock: boolean;
  saleableUnits: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  category: 'cow_milk' | 'a2_milk' | 'buffalo_milk' | 'ghee' | 'paneer' | 'curd';
  fatContent: string;
  snfContent: string;
  coldChainTemp: string;
  shelfLife: string;
  imageUrl: string;
  isActive: boolean;
  size?: string;
  price?: number;
  variants: AdminProductVariant[];
}
