import { Role } from '../enums';

export interface UserDto {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: Role;
  walletBalancePaise: number;
  isActive: boolean;
  assignedRoute?: string;
  vehicleNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterDto {
  name: string;
  phone: string;
  email?: string;
  password?: string;
  role?: Role;
}

export interface LoginDto {
  phoneOrEmail: string;
  password?: string;
  otp?: string;
  role?: Role;
}

export interface AuthResponseDto {
  user: UserDto;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
}

export interface RefreshTokenDto {
  refreshToken?: string;
}
