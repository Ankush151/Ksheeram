export type AddressType = 'home' | 'work' | 'other';

export interface Address {
  id: string;
  userId: string;
  label: string;
  addressType: AddressType;
  flatNumber: string;
  buildingName: string;
  streetArea: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  deliveryInstructions?: string;
  isDefault: boolean;
  contactPhone?: string;
}

export interface CreateAddressPayload {
  label: string;
  addressType: AddressType;
  flatNumber: string;
  buildingName: string;
  streetArea: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  deliveryInstructions?: string;
  isDefault: boolean;
  contactPhone?: string;
}

export type UpdateAddressPayload = Partial<CreateAddressPayload>;
