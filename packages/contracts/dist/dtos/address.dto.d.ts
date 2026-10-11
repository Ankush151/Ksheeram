export interface AddressDto {
    id: string;
    userId: string;
    label: string;
    flatNumber: string;
    buildingName: string;
    streetArea: string;
    landmark?: string;
    city: string;
    pincode: string;
    isDefault: boolean;
    deliveryInstructions?: string;
    createdAt: string;
    updatedAt: string;
}
export interface CreateAddressDto {
    label: string;
    flatNumber: string;
    buildingName: string;
    streetArea: string;
    landmark?: string;
    city?: string;
    pincode: string;
    isDefault?: boolean;
    deliveryInstructions?: string;
}
export interface UpdateAddressDto extends Partial<CreateAddressDto> {
}
//# sourceMappingURL=address.dto.d.ts.map