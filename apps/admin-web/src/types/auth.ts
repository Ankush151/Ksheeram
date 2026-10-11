export type UserRole = 'admin' | 'delivery_agent' | 'operations' | 'operations_manager';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  assignedRoute?: string;
  vehicleNumber?: string;
  isActive: boolean;
  avatarUrl?: string;
}

export interface LoginCredentials {
  phoneOrEmail: string;
  password?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: AdminUser;
  token?: string;
}
