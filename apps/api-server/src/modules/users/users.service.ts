import mongoose from 'mongoose';
import { AddressDto, CreateAddressDto, Role, UpdateAddressDto, UserDto } from '@ksheeraam/contracts';
import { UserModel } from '../../models/User';
import { AddressModel, IAddress } from '../../models/Address';
import { ForbiddenError, NotFoundError } from '../../utils/errors';
import { mapUserToDto } from '../auth/auth.service';

export function mapAddressToDto(addr: IAddress): AddressDto {
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

export class UsersService {
  async listUsers(role?: Role): Promise<UserDto[]> {
    const filter: any = {};
    if (role) filter.role = role;
    const users = await UserModel.find(filter).sort({ createdAt: -1 });
    return users.map(mapUserToDto);
  }

  async getUserById(userId: string): Promise<UserDto> {
    const user = await UserModel.findById(userId);
    if (!user) throw new NotFoundError('User not found.');
    return mapUserToDto(user);
  }

  // Address operations
  async listUserAddresses(requestingUserId: string, targetUserId: string, requestingRole: Role): Promise<AddressDto[]> {
    if (requestingRole !== Role.ADMIN && requestingUserId !== targetUserId) {
      throw new ForbiddenError('You can only access your own addresses.');
    }
    const addresses = await AddressModel.find({ userId: targetUserId }).sort({ isDefault: -1, createdAt: -1 });
    return addresses.map(mapAddressToDto);
  }

  async createAddress(userId: string, data: CreateAddressDto): Promise<AddressDto> {
    if (data.isDefault) {
      await AddressModel.updateMany({ userId }, { $set: { isDefault: false } });
    } else {
      const count = await AddressModel.countDocuments({ userId });
      if (count === 0) data.isDefault = true;
    }

    const addr = await AddressModel.create({
      userId: new mongoose.Types.ObjectId(userId),
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

  async updateAddress(
    addressId: string,
    requestingUserId: string,
    requestingRole: Role,
    data: UpdateAddressDto
  ): Promise<AddressDto> {
    const addr = await AddressModel.findById(addressId);
    if (!addr) throw new NotFoundError('Address not found.');

    if (requestingRole !== Role.ADMIN && addr.userId.toString() !== requestingUserId) {
      throw new ForbiddenError('You are not authorized to update this address.');
    }

    if (data.isDefault) {
      await AddressModel.updateMany({ userId: addr.userId }, { $set: { isDefault: false } });
    }

    Object.assign(addr, data);
    await addr.save();
    return mapAddressToDto(addr);
  }

  async deleteAddress(addressId: string, requestingUserId: string, requestingRole: Role): Promise<void> {
    const addr = await AddressModel.findById(addressId);
    if (!addr) throw new NotFoundError('Address not found.');

    if (requestingRole !== Role.ADMIN && addr.userId.toString() !== requestingUserId) {
      throw new ForbiddenError('You are not authorized to delete this address.');
    }

    await AddressModel.findByIdAndDelete(addressId);
  }
}

export const usersService = new UsersService();
