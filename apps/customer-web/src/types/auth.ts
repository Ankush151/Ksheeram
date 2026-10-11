export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  defaultAddressId?: string;
  walletBalance: number;
  isSubscribed: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface LoginCredentials {
  phoneOrEmail: string;
  password?: string;
  otp?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}
