export type DeliveryStatus = 'assigned' | 'out_for_delivery' | 'delivered' | 'failed';

export interface DeliveryAgent {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'scooter' | 'van' | 'e_bike';
  vehicleNumber: string;
  assignedArea: string;
  assignedSector?: string;
  status: 'available' | 'on_route' | 'off_duty';
  activeDeliveriesCount: number;
  completedTodayCount: number;
  failedTodayCount: number;
}

export interface ManifestOrderItem {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  flatNumber: string;
  buildingName: string;
  streetArea: string;
  landmark?: string;
  pincode: string;
  customerAddress?: string; // formatted combined string
  deliveryInstructions?: string;
  items: {
    productName: string;
    size: '500ml' | '1L';
    quantity: number;
  }[];
  paymentStatus: 'paid' | 'pending' | 'failed';
  paymentMethod: string;
  amountToCollect: number; // 0 if prepaid, >0 if COD
  status: DeliveryStatus;
  assignedAgentId?: string;
  assignedAgentName?: string;
  deliverySlot: string;
  deliveryDate?: string;
  deliveredAt?: string;
  failedReason?: string;
  agentNotes?: string;
}

export interface CompleteDeliveryPayload {
  orderId: string;
  agentNotes?: string;
  cashCollected?: boolean | number;
}

export interface FailDeliveryPayload {
  orderId: string;
  reason: 'customer_unreachable' | 'door_locked_no_drop_box' | 'incorrect_address' | 'bottle_leakage' | 'other' | string;
  notes?: string;
}

export interface AssignAgentPayload {
  orderIds: string[];
  agentId: string;
}
