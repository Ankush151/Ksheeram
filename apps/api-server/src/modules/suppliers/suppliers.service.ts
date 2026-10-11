import { CreateSupplierDto, SupplierDto } from '@ksheeraam/contracts';
import { ISupplier, SupplierModel } from '../../models/Supplier';
import { ConflictError, NotFoundError } from '../../utils/errors';

export function mapSupplierToDto(s: ISupplier): SupplierDto {
  return {
    id: s._id.toString(),
    code: s.code,
    name: s.name,
    contactPerson: s.contactPerson,
    phone: s.phone,
    email: s.email,
    villageDistrict: s.villageDistrict,
    state: s.state,
    milkTypes: s.milkTypes,
    dailySupplyCapacityUnits: s.dailySupplyCapacityUnits,
    paymentTerms: s.paymentTerms,
    rating: s.rating,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export class SuppliersService {
  async listSuppliers(): Promise<SupplierDto[]> {
    const suppliers = await SupplierModel.find().sort({ code: 1 });
    return suppliers.map(mapSupplierToDto);
  }

  async getSupplierById(id: string): Promise<SupplierDto> {
    const supplier = await SupplierModel.findById(id);
    if (!supplier) throw new NotFoundError('Supplier not found.');
    return mapSupplierToDto(supplier);
  }

  async createSupplier(data: CreateSupplierDto): Promise<SupplierDto> {
    // Generate code if not provided
    const count = await SupplierModel.countDocuments();
    const code = `SUP-${String(count + 1).padStart(3, '0')}`;

    const supplier = await SupplierModel.create({
      code,
      name: data.name,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      villageDistrict: data.villageDistrict,
      state: data.state || 'Karnataka',
      milkTypes: data.milkTypes,
      dailySupplyCapacityUnits: data.dailySupplyCapacityUnits,
      paymentTerms: data.paymentTerms || 'Weekly Bank Transfer',
      status: data.status || 'active',
      rating: 4.8,
    });

    return mapSupplierToDto(supplier);
  }

  async updateSupplier(id: string, data: Partial<CreateSupplierDto>): Promise<SupplierDto> {
    const supplier = await SupplierModel.findById(id);
    if (!supplier) throw new NotFoundError('Supplier not found.');

    Object.assign(supplier, data);
    await supplier.save();
    return mapSupplierToDto(supplier);
  }
}

export const suppliersService = new SuppliersService();
