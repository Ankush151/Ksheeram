export type MilkType = 'cow' | 'buffalo' | 'a2_gir';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  villageDistrict: string;
  state: string;
  location?: string;
  milkTypes: MilkType[];
  dailySupplyCapacityUnits: number;
  paymentTerms: 'weekly' | 'bi_weekly' | 'monthly' | 'immediate';
  bankAccountNumber?: string;
  ifscCode?: string;
  rating: number; // e.g. 4.8
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CreateSupplierPayload {
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  villageDistrict: string;
  state: string;
  location?: string;
  milkTypes: MilkType[];
  dailySupplyCapacityUnits: number;
  paymentTerms: 'weekly' | 'bi_weekly' | 'monthly' | 'immediate';
  status: 'active' | 'inactive';
}
