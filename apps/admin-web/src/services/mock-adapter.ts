import {
  MOCK_ADMIN_USERS,
  MOCK_SUPPLIERS,
  MOCK_INVENTORY,
  MOCK_STOCK_LOGS,
  MOCK_PURCHASE_ORDERS,
  MOCK_CUSTOMERS,
  MOCK_ADMIN_SUBSCRIPTIONS,
  MOCK_ADMIN_ORDERS,
  MOCK_DELIVERY_AGENTS,
  MOCK_MANIFEST_ITEMS,
  MOCK_BILLING_INVOICES,
  MOCK_RECONCILIATION_ALERTS,
  MOCK_WHATSAPP_REQUESTS,
} from './mock-data';
import { AdminUser, LoginCredentials } from '@/types/auth';
import { Supplier, CreateSupplierPayload } from '@/types/suppliers';
import { Customer } from '@/types/customers';
import { PurchaseOrder, CreatePurchaseOrderPayload, ReceiveStockPayload } from '@/types/procurement';
import { InventoryItem, StockMovementLog, AdjustStockPayload } from '@/types/inventory';
import { AdminSubscription } from '@/types/subscriptions';
import { AdminOrder } from '@/types/orders';
import {
  DeliveryAgent,
  ManifestOrderItem,
  CompleteDeliveryPayload,
  FailDeliveryPayload,
  AssignAgentPayload,
} from '@/types/delivery';
import { BillingInvoice, PaymentReconciliationAlert } from '@/types/billing';
import { WhatsAppOrderRequest } from '@/types/whatsapp';
import { DashboardStats } from '@/types/dashboard';

// Mutable store for development simulation
let currentUser: AdminUser | null = { ...MOCK_ADMIN_USERS[0] }; // default to admin Rajesh
let suppliers = [...MOCK_SUPPLIERS];
let inventory = [...MOCK_INVENTORY];
let stockLogs = [...MOCK_STOCK_LOGS];
let purchaseOrders = [...MOCK_PURCHASE_ORDERS];
let customers = [...MOCK_CUSTOMERS];
let subscriptions = [...MOCK_ADMIN_SUBSCRIPTIONS];
let orders = [...MOCK_ADMIN_ORDERS];
let deliveryAgents = [...MOCK_DELIVERY_AGENTS];
let manifestItems = [...MOCK_MANIFEST_ITEMS];
let invoices = [...MOCK_BILLING_INVOICES];
let reconciliationAlerts = [...MOCK_RECONCILIATION_ALERTS];
let whatsappRequests = [...MOCK_WHATSAPP_REQUESTS];

function delay(ms = 250): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const adminMockHandlers = {
  // --- AUTH ---
  async getCurrentUser(): Promise<AdminUser | null> {
    await delay(150);
    return currentUser;
  },

  async login(creds: LoginCredentials): Promise<{ user: AdminUser; token: string }> {
    await delay(300);
    // Find matching role or user
    const matched =
      MOCK_ADMIN_USERS.find((u) => u.role === creds.role) ||
      MOCK_ADMIN_USERS.find(
        (u) => u.phone === creds.phoneOrEmail || u.email === creds.phoneOrEmail
      ) ||
      (creds.role === 'delivery_agent' ? MOCK_ADMIN_USERS[1] : MOCK_ADMIN_USERS[0]);

    currentUser = matched;
    return { user: matched, token: `mock-token-${matched.role}` };
  },

  async logout(): Promise<{ success: boolean }> {
    await delay(150);
    currentUser = null;
    return { success: true };
  },

  // --- DASHBOARD ---
  async getDashboardStats(): Promise<DashboardStats> {
    await delay(250);
    const pendingDeliveries = manifestItems.filter(
      (m) => m.status === 'assigned' || m.status === 'out_for_delivery'
    ).length;
    const completedDeliveries = manifestItems.filter((m) => m.status === 'delivered').length;
    const failedDeliveries = manifestItems.filter((m) => m.status === 'failed').length;

    const unallocatedCount = orders.filter((o) => !o.stockAllocated).length;

    return {
      todayScheduledOrders: orders.length,
      ordersAwaitingStockAllocation: unallocatedCount,
      deliveries: {
        pending: pendingDeliveries,
        inProgress: manifestItems.filter((m) => m.status === 'out_for_delivery').length,
        completed: completedDeliveries,
        failed: failedDeliveries,
        total: manifestItems.length,
      },
      paymentReconciliationAlerts: reconciliationAlerts.filter((r) => r.status === 'unresolved').length,
      packagedStock: inventory.map((inv) => ({
        productId: inv.productId,
        productName: inv.productName,
        size: inv.size,
        physical: inv.physicalUnits,
        reserved: inv.reservedUnits,
        available: inv.availableUnits,
        damaged: inv.damagedUnits,
      })),
      tomorrowDemand: [
        {
          productId: 'prod_cow_milk',
          productName: 'Farm Fresh Cow Milk',
          size: '1L',
          unitsNeededTomorrow: 380,
          expectedProcurement: 400,
          projectedShortage: 0,
        },
        {
          productId: 'prod_a2_milk',
          productName: 'Desi Gir Cow A2 Milk',
          size: '1L',
          unitsNeededTomorrow: 260,
          expectedProcurement: 300,
          projectedShortage: 0,
        },
        {
          productId: 'prod_buffalo_milk',
          productName: 'Creamy Rich Buffalo Milk',
          size: '1L',
          unitsNeededTomorrow: 195,
          expectedProcurement: 180,
          projectedShortage: 15, // shortage alert
        },
      ],
      lowStockWarnings: inventory
        .filter((inv) => inv.availableUnits <= inv.reorderLevel)
        .map((inv) => ({
          productId: inv.productId,
          productName: inv.productName,
          size: inv.size,
          currentAvailable: inv.availableUnits,
          minThreshold: inv.reorderLevel,
          urgency: inv.availableUnits <= 20 ? 'critical' : 'warning',
        })),
    };
  },

  // --- CUSTOMERS ---
  async getCustomers(search?: string): Promise<Customer[]> {
    await delay(200);
    if (!search || !search.trim()) return [...customers];
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.addressSummary.toLowerCase().includes(q)
    );
  },

  // --- SUPPLIERS ---
  async getSuppliers(): Promise<Supplier[]> {
    await delay(200);
    return [...suppliers];
  },

  async createSupplier(payload: CreateSupplierPayload): Promise<Supplier> {
    await delay(350);
    const newSup: Supplier = {
      ...payload,
      id: `sup_${Date.now()}`,
      code: `SUP-GEN-${Math.floor(10 + Math.random() * 90)}`,
      rating: 5.0,
      createdAt: new Date().toISOString(),
    };
    suppliers.unshift(newSup);
    return newSup;
  },

  async updateSupplier(id: string, payload: Partial<CreateSupplierPayload>): Promise<Supplier> {
    await delay(300);
    const index = suppliers.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Supplier not found');
    suppliers[index] = { ...suppliers[index], ...payload };
    return suppliers[index];
  },

  // --- PROCUREMENT ---
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    await delay(250);
    return [...purchaseOrders];
  },

  async createPurchaseOrder(payload: CreatePurchaseOrderPayload): Promise<PurchaseOrder> {
    await delay(400);
    const sup = suppliers.find((s) => s.id === payload.supplierId);
    let totalUnits = 0;
    let totalAmt = 0;

    const items = payload.items.map((it, idx) => {
      totalUnits += it.orderedUnits;
      const sub = it.orderedUnits * it.unitCost;
      totalAmt += sub;
      return {
        id: `poi_${Date.now()}_${idx}`,
        productId: it.productId,
        productName: it.productName,
        size: it.size,
        packagingType: it.packagingType,
        orderedUnits: it.orderedUnits,
        receivedUnits: 0,
        rejectedUnits: 0,
        unitCost: it.unitCost,
        totalCost: sub,
      };
    });

    const newPO: PurchaseOrder = {
      id: `po_${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
      supplierId: payload.supplierId,
      supplierName: sup?.name || 'Dairy Supplier',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: payload.expectedDeliveryDate,
      status: 'ordered',
      items,
      totalUnitsOrdered: totalUnits,
      totalUnitsReceived: 0,
      totalUnitsRejected: 0,
      totalAmount: totalAmt,
      notes: payload.notes,
      createdAt: new Date().toISOString(),
    };

    purchaseOrders.unshift(newPO);
    return newPO;
  },

  async receiveStock(payload: ReceiveStockPayload): Promise<PurchaseOrder> {
    await delay(450);
    const index = purchaseOrders.findIndex((p) => p.id === payload.poId);
    if (index === -1) throw new Error('Purchase order not found');

    const po = purchaseOrders[index];
    let totalRcv = 0;
    let totalRej = 0;

    po.items = po.items.map((item) => {
      const match = payload.items.find((i) => i.itemId === item.id);
      if (match) {
        totalRcv += match.receivedUnits;
        totalRej += match.rejectedUnits;

        // Auto-update inventory for accepted packaged units
        const inv = inventory.find((i) => i.productId === item.productId && i.size === item.size);
        if (inv) {
          inv.physicalUnits += match.receivedUnits;
          inv.availableUnits = inv.physicalUnits - inv.reservedUnits;
          inv.damagedUnits += match.rejectedUnits;
          inv.lastUpdated = new Date().toISOString();

          // Log stock inward
          stockLogs.unshift({
            id: `log_${Date.now()}_${item.id}`,
            timestamp: new Date().toISOString(),
            productId: item.productId,
            productName: item.productName,
            size: item.size,
            movementType: 'procurement_inward',
            deltaUnits: match.receivedUnits,
            balanceAfter: inv.physicalUnits,
            referenceId: po.poNumber,
            reason: `Received from ${po.supplierName}`,
            performedBy: currentUser?.name || 'Quality Lead',
          });
        }

        return {
          ...item,
          receivedUnits: match.receivedUnits,
          rejectedUnits: match.rejectedUnits,
          rejectionReason: match.rejectionReason,
        };
      }
      return item;
    });

    po.status = totalRcv > 0 ? 'received' : 'cancelled';
    po.totalUnitsReceived = totalRcv;
    po.totalUnitsRejected = totalRej;
    po.chillingTempVerifiedAtReceipt = payload.chillingTemp;
    po.qualityTesterName = payload.qualityTesterName;
    po.receivedAt = new Date().toISOString();

    purchaseOrders[index] = po;
    return po;
  },

  // --- INVENTORY ---
  async getInventory(): Promise<InventoryItem[]> {
    await delay(200);
    return [...inventory];
  },

  async getStockLogs(): Promise<StockMovementLog[]> {
    await delay(200);
    return [...stockLogs];
  },

  async adjustStock(payload: AdjustStockPayload): Promise<InventoryItem> {
    await delay(350);
    const index = inventory.findIndex((i) => i.id === payload.inventoryId);
    if (index === -1) throw new Error('Inventory record not found');

    const item = inventory[index];
    let delta = 0;

    if (payload.adjustmentType === 'add_stock') {
      delta = payload.units;
      item.physicalUnits += delta;
      item.availableUnits = item.physicalUnits - item.reservedUnits;
    } else if (payload.adjustmentType === 'mark_damaged') {
      delta = -payload.units;
      item.physicalUnits = Math.max(0, item.physicalUnits - payload.units);
      item.damagedUnits += payload.units;
      item.availableUnits = Math.max(0, item.physicalUnits - item.reservedUnits);
    } else {
      // manual audit
      delta = payload.units - item.physicalUnits;
      item.physicalUnits = payload.units;
      item.availableUnits = item.physicalUnits - item.reservedUnits;
    }

    item.lastUpdated = new Date().toISOString();
    inventory[index] = item;

    stockLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: item.productId,
      productName: item.productName,
      size: item.size,
      movementType: payload.adjustmentType === 'mark_damaged' ? 'damage_spoilage' : 'audit_adjustment',
      deltaUnits: delta,
      balanceAfter: item.physicalUnits,
      reason: payload.reason,
      performedBy: currentUser?.name || 'Admin',
    });

    return item;
  },

  // --- SUBSCRIPTIONS ---
  async getSubscriptions(): Promise<AdminSubscription[]> {
    await delay(200);
    return [...subscriptions];
  },

  async pauseSubscription(id: string): Promise<AdminSubscription> {
    await delay(250);
    const index = subscriptions.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Subscription not found');
    subscriptions[index].status = 'paused';
    return subscriptions[index];
  },

  async resumeSubscription(id: string): Promise<AdminSubscription> {
    await delay(250);
    const index = subscriptions.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Subscription not found');
    subscriptions[index].status = 'active';
    return subscriptions[index];
  },

  // --- ORDERS ---
  async getOrders(): Promise<AdminOrder[]> {
    await delay(200);
    return [...orders];
  },

  async allocateStock(orderId: string): Promise<AdminOrder> {
    await delay(300);
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) throw new Error('Order not found');
    orders[index].stockAllocated = true;
    orders[index].status = 'packed';
    return orders[index];
  },

  // --- DELIVERY MANAGEMENT ---
  async getDeliveryManifest(): Promise<ManifestOrderItem[]> {
    await delay(200);
    return [...manifestItems];
  },

  async getDeliveryAgents(): Promise<DeliveryAgent[]> {
    await delay(200);
    return [...deliveryAgents];
  },

  async assignAgent(payload: AssignAgentPayload): Promise<{ success: boolean }> {
    await delay(350);
    const agent = deliveryAgents.find((a) => a.id === payload.agentId);
    if (!agent) throw new Error('Agent not found');

    manifestItems = manifestItems.map((m) => {
      if (payload.orderIds.includes(m.orderId)) {
        return {
          ...m,
          assignedAgentId: agent.id,
          assignedAgentName: agent.name,
          status: 'assigned',
        };
      }
      return m;
    });

    // Also update order records
    orders = orders.map((o) => {
      if (payload.orderIds.includes(o.id)) {
        return {
          ...o,
          assignedAgentId: agent.id,
          assignedAgentName: agent.name,
          status: 'confirmed',
        };
      }
      return o;
    });

    return { success: true };
  },

  // --- AGENT INTERFACE SPECIFIC ---
  async getAgentManifest(agentId: string): Promise<ManifestOrderItem[]> {
    await delay(200);
    // Return assigned orders for this specific agent only
    return manifestItems.filter((m) => m.assignedAgentId === agentId);
  },

  async completeDelivery(payload: CompleteDeliveryPayload): Promise<ManifestOrderItem> {
    await delay(400);
    const index = manifestItems.findIndex((m) => m.orderId === payload.orderId);
    if (index === -1) throw new Error('Delivery manifest item not found');

    const updated: ManifestOrderItem = {
      ...manifestItems[index],
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
      agentNotes: payload.agentNotes,
      paymentStatus: 'paid', // Cash collected
    };

    manifestItems[index] = updated;

    // Update main order status
    const ordIndex = orders.findIndex((o) => o.id === payload.orderId);
    if (ordIndex > -1) {
      orders[ordIndex].status = 'delivered';
      if (payload.cashCollected) {
        orders[ordIndex].paymentStatus = 'paid';
      }
    }

    return updated;
  },

  async failDelivery(payload: FailDeliveryPayload): Promise<ManifestOrderItem> {
    await delay(400);
    const index = manifestItems.findIndex((m) => m.orderId === payload.orderId);
    if (index === -1) throw new Error('Delivery manifest item not found');

    const updated: ManifestOrderItem = {
      ...manifestItems[index],
      status: 'failed',
      failedReason: `${payload.reason}: ${payload.notes || ''}`,
      agentNotes: payload.notes,
    };

    manifestItems[index] = updated;

    // Update main order
    const ordIndex = orders.findIndex((o) => o.id === payload.orderId);
    if (ordIndex > -1) {
      orders[ordIndex].status = 'cancelled';
      orders[ordIndex].failedReason = updated.failedReason;
    }

    return updated;
  },

  // --- BILLING & RECONCILIATION ---
  async getInvoices(): Promise<BillingInvoice[]> {
    await delay(200);
    return [...invoices];
  },

  async getReconciliationAlerts(): Promise<PaymentReconciliationAlert[]> {
    await delay(200);
    return [...reconciliationAlerts];
  },

  async resolveAlert(id: string, notes: string): Promise<PaymentReconciliationAlert> {
    await delay(300);
    const index = reconciliationAlerts.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Alert not found');
    reconciliationAlerts[index].status = 'resolved';
    reconciliationAlerts[index].resolutionNotes = notes;
    return reconciliationAlerts[index];
  },

  // --- WHATSAPP ---
  async getWhatsAppRequests(): Promise<WhatsAppOrderRequest[]> {
    await delay(200);
    return [...whatsappRequests];
  },

  async updateWhatsAppStatus(id: string, status: 'new' | 'in_progress' | 'converted' | 'dismissed'): Promise<WhatsAppOrderRequest> {
    await delay(250);
    const index = whatsappRequests.findIndex((w) => w.id === id);
    if (index === -1) throw new Error('Request not found');
    whatsappRequests[index].status = status;
    whatsappRequests[index].handledBy = currentUser?.name || 'Admin';
    return whatsappRequests[index];
  },
};
