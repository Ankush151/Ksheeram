import { MilkCategory, PackageSize, PackagingType } from '../enums';

export interface ProductVariantDto {
  id: string;
  size: PackageSize;
  packagingType: PackagingType;
  pricePaise: number; // in integer paise
  mrpPaise: number;
  inStock: boolean;
  saleableUnits: number;
}

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: MilkCategory;
  fatContent: string;
  snfContent: string;
  coldChainTemp: string;
  shelfLife: string;
  imageUrl: string;
  isActive: boolean;
  variants: ProductVariantDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  slug: string;
  description?: string;
  category: MilkCategory;
  fatContent: string;
  snfContent: string;
  coldChainTemp: string;
  shelfLife: string;
  imageUrl: string;
  isActive?: boolean;
  variants: {
    size: PackageSize;
    packagingType: PackagingType;
    pricePaise: number;
    mrpPaise: number;
  }[];
}
