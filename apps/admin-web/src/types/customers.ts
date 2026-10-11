export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  addressSummary: string;
  pincode: string;
  walletBalance: number;
  isSubscribed: boolean;
  activeSubscriptionCount: number;
  totalOrdersPlaced: number;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface CustomerFilter {
  search?: string;
  status?: string;
  isSubscribed?: boolean;
}
