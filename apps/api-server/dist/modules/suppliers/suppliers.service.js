"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suppliersService = exports.SuppliersService = void 0;
exports.mapSupplierToDto = mapSupplierToDto;
const Supplier_1 = require("../../models/Supplier");
const errors_1 = require("../../utils/errors");
function mapSupplierToDto(s) {
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
class SuppliersService {
    async listSuppliers() {
        const suppliers = await Supplier_1.SupplierModel.find().sort({ code: 1 });
        return suppliers.map(mapSupplierToDto);
    }
    async getSupplierById(id) {
        const supplier = await Supplier_1.SupplierModel.findById(id);
        if (!supplier)
            throw new errors_1.NotFoundError('Supplier not found.');
        return mapSupplierToDto(supplier);
    }
    async createSupplier(data) {
        // Generate code if not provided
        const count = await Supplier_1.SupplierModel.countDocuments();
        const code = `SUP-${String(count + 1).padStart(3, '0')}`;
        const supplier = await Supplier_1.SupplierModel.create({
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
    async updateSupplier(id, data) {
        const supplier = await Supplier_1.SupplierModel.findById(id);
        if (!supplier)
            throw new errors_1.NotFoundError('Supplier not found.');
        Object.assign(supplier, data);
        await supplier.save();
        return mapSupplierToDto(supplier);
    }
}
exports.SuppliersService = SuppliersService;
exports.suppliersService = new SuppliersService();
//# sourceMappingURL=suppliers.service.js.map