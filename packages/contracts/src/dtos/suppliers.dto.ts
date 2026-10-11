export interface SupplierDto {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  villageDistrict: string;
  state: string;
  milkTypes: string[];
  dailySupplyCapacityUnits: number;
  paymentTerms: string;
  rating: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  villageDistrict: string;
  state: string;
  milkTypes: string[];
  dailySupplyCapacityUnits: number;
  paymentTerms: string;
  status?: 'active' | 'inactive';
}
