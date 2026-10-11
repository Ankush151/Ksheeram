"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = exports.UsersService = void 0;
exports.mapAddressToDto = mapAddressToDto;
const mongoose_1 = __importDefault(require("mongoose"));
const contracts_1 = require("@ksheeraam/contracts");
const User_1 = require("../../models/User");
const Address_1 = require("../../models/Address");
const errors_1 = require("../../utils/errors");
const auth_service_1 = require("../auth/auth.service");
function mapAddressToDto(addr) {
    return {
        id: addr._id.toString(),
        userId: addr.userId.toString(),
        label: addr.label,
        flatNumber: addr.flatNumber,
        buildingName: addr.buildingName,
        streetArea: addr.streetArea,
        landmark: addr.landmark,
        city: addr.city,
        pincode: addr.pincode,
        isDefault: addr.isDefault,
        deliveryInstructions: addr.deliveryInstructions,
        createdAt: addr.createdAt.toISOString(),
        updatedAt: addr.updatedAt.toISOString(),
    };
}
class UsersService {
    async listUsers(role) {
        const filter = {};
        if (role)
            filter.role = role;
        const users = await User_1.UserModel.find(filter).sort({ createdAt: -1 });
        return users.map(auth_service_1.mapUserToDto);
    }
    async getUserById(userId) {
        const user = await User_1.UserModel.findById(userId);
        if (!user)
            throw new errors_1.NotFoundError('User not found.');
        return (0, auth_service_1.mapUserToDto)(user);
    }
    // Address operations
    async listUserAddresses(requestingUserId, targetUserId, requestingRole) {
        if (requestingRole !== contracts_1.Role.ADMIN && requestingUserId !== targetUserId) {
            throw new errors_1.ForbiddenError('You can only access your own addresses.');
        }
        const addresses = await Address_1.AddressModel.find({ userId: targetUserId }).sort({ isDefault: -1, createdAt: -1 });
        return addresses.map(mapAddressToDto);
    }
    async createAddress(userId, data) {
        if (data.isDefault) {
            await Address_1.AddressModel.updateMany({ userId }, { $set: { isDefault: false } });
        }
        else {
            const count = await Address_1.AddressModel.countDocuments({ userId });
            if (count === 0)
                data.isDefault = true;
        }
        const addr = await Address_1.AddressModel.create({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            label: data.label || 'Home',
            flatNumber: data.flatNumber,
            buildingName: data.buildingName,
            streetArea: data.streetArea,
            landmark: data.landmark,
            city: data.city || 'Bangalore',
            pincode: data.pincode,
            isDefault: Boolean(data.isDefault),
            deliveryInstructions: data.deliveryInstructions,
        });
        return mapAddressToDto(addr);
    }
    async updateAddress(addressId, requestingUserId, requestingRole, data) {
        const addr = await Address_1.AddressModel.findById(addressId);
        if (!addr)
            throw new errors_1.NotFoundError('Address not found.');
        if (requestingRole !== contracts_1.Role.ADMIN && addr.userId.toString() !== requestingUserId) {
            throw new errors_1.ForbiddenError('You are not authorized to update this address.');
        }
        if (data.isDefault) {
            await Address_1.AddressModel.updateMany({ userId: addr.userId }, { $set: { isDefault: false } });
        }
        Object.assign(addr, data);
        await addr.save();
        return mapAddressToDto(addr);
    }
    async deleteAddress(addressId, requestingUserId, requestingRole) {
        const addr = await Address_1.AddressModel.findById(addressId);
        if (!addr)
            throw new errors_1.NotFoundError('Address not found.');
        if (requestingRole !== contracts_1.Role.ADMIN && addr.userId.toString() !== requestingUserId) {
            throw new errors_1.ForbiddenError('You are not authorized to delete this address.');
        }
        await Address_1.AddressModel.findByIdAndDelete(addressId);
    }
}
exports.UsersService = UsersService;
exports.usersService = new UsersService();
//# sourceMappingURL=users.service.js.map