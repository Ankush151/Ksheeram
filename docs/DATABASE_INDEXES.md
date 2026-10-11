# Ksheeraam MongoDB Atlas Schema & Index Architecture

This document specifies all Mongoose collections, schemas, and performance/concurrency indexes designed for Ksheeraam's production MongoDB Atlas deployment.

---

## 1. Domain Standards

- **Money Precision**: All currency amounts are strictly stored as **integer paise** (`1 INR = 100 paise`). Floating-point arithmetic is prohibited.
- **Quantities**: Quantities are stored as **integer packaged units** (e.g. 500ml bottles, 1L bottles).
- **Timezone**: Canonical delivery-date keys are indexed in `Asia/Kolkata` as `YYYY-MM-DD`.

---

## 2. Collections & Index Definitions

### 1. `users`
Represents registered customers, administrators, and delivery agents.
```ts
UserSchema.index({ phone: 1 }, { unique: true });
UserSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string', $gt: '' } } }
);
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
```
- **Rationale**: Fast customer phone login lookups; ensures phone numbers are unique while allowing sparse unique emails.

---

### 2. `addresses`
Delivery addresses with locality and doorstep instructions.
```ts
AddressSchema.index({ userId: 1, isDefault: -1 });
AddressSchema.index({ pincode: 1 });
```
- **Rationale**: Efficient loading of a customer's address book with their default address sorted first; route grouping by pincode.

---

### 3. `products`
Dairy product catalog with category nutrition specifications and packaged variants.
```ts
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ category: 1, isActive: 1 });
```
- **Rationale**: URL slug uniqueness; instantaneous filtered querying for customer store pages.

---

### 4. `suppliers`
Dairy farms supplying raw and pasteurized milk.
```ts
SupplierSchema.index({ code: 1 }, { unique: true });
SupplierSchema.index({ status: 1 });
```
- **Rationale**: Unique procurement codes (e.g., `SUP-001`).

---

### 5. `purchaseorders`
Procurement dock orders with quality testing and chilling temperature records.
```ts
PurchaseOrderSchema.index({ poNumber: 1 }, { unique: true });
PurchaseOrderSchema.index({ supplierId: 1, orderDate: -1 });
PurchaseOrderSchema.index({ status: 1 });
```
- **Rationale**: Fast PO number lookups and supplier purchase history analysis.

---

### 6. `inventorybalances`
Packaged unit inventory on hand.
```ts
InventoryBalanceSchema.index(
  { productId: 1, size: 1, packagingType: 1 },
  { unique: true }
);
```
- **Compound Unique Guarantee**: Guarantees exactly one balance record exists per product, package size, and packaging type.
- **Concurrency-Safe Atomic Queries**: Atomic conditional reservation uses `$expr: { $gte: [{ $subtract: ['$physicalUnits', '$reservedUnits'] }, quantity] }`.

---

### 7. `inventorymovements`
Immutable audit log of all stock changes (dock receipts, reservations, dispatches, damages, returns).
```ts
InventoryMovementSchema.index({ inventoryId: 1, timestamp: -1 });
InventoryMovementSchema.index({ productId: 1, timestamp: -1 });
InventoryMovementSchema.index({ movementType: 1, timestamp: -1 });
```

---

### 8. `subscriptions`
Recurring milk subscription contracts (daily, alternate, custom weekdays).
```ts
SubscriptionSchema.index({ subscriptionNumber: 1 }, { unique: true });
SubscriptionSchema.index({ customerId: 1, createdAt: -1 });
SubscriptionSchema.index({ status: 1, nextDeliveryDate: 1 });
```
- **Rationale**: The background order generation job queries `{ status: 'active', nextDeliveryDate: targetDate }` with index-covered scans.

---

### 9. `orders`
Immutable order snapshots with embedded item snapshots.
```ts
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ deliveryDate: 1, status: 1 });
OrderSchema.index({ assignedAgentId: 1, deliveryDate: 1 });

// Critical Idempotency Index:
OrderSchema.index(
  { subscriptionId: 1, deliveryDate: 1 },
  {
    unique: true,
    partialFilterExpression: { subscriptionId: { $type: 'objectId' } },
  }
);

// One-time order idempotency:
OrderSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string', $gt: '' } },
  }
);
```
- **CRITICAL IDEMPOTENCY GUARANTEE**:
  The partial compound unique index `{ subscriptionId: 1, deliveryDate: 1 }` guarantees that even if the order generation cron runs multiple times concurrently or on retry, **it is physically impossible for duplicate subscription orders or double wallet charges to occur**.

---

### 10. `deliveryassignments`
Delivery route stops and manifest records.
```ts
DeliveryAssignmentSchema.index({ orderId: 1 }, { unique: true });
DeliveryAssignmentSchema.index({ assignedAgentId: 1, deliveryDate: 1, status: 1 });
DeliveryAssignmentSchema.index({ deliveryDate: 1, status: 1 });
```
- **Rationale**: Immediate extraction of an agent's daily delivery manifest; atomic tracking of doorstep drops.

---

### 11. `invoices`
Formal tax invoices with itemized totals in paise.
```ts
InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ customerId: 1, issuedAt: -1 });
InvoiceSchema.index({ orderId: 1 });
```

---

### 12. `payments`
Payment transactions with provider gateway references.
```ts
PaymentSchema.index({ paymentNumber: 1 }, { unique: true });
PaymentSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string', $gt: '' } },
  }
);
PaymentSchema.index({ customerId: 1, createdAt: -1 });
PaymentSchema.index({ gatewayTxnId: 1 });
```
- **Rationale**: Webhook retry deduplication; prevents duplicate payment credits.

---

### 13. `prepaidledgerentries`
Double-entry audit log of all customer wallet balance credits, debits, refunds, and adjustments.
```ts
PrepaidLedgerEntrySchema.index({ customerId: 1, createdAt: -1 });
```

---

### 14. `whatsappmessagerecords`
Conversational WhatsApp inbound and outbound events.
```ts
WhatsAppMessageRecordSchema.index({ messageId: 1 }, { unique: true });
WhatsAppMessageRecordSchema.index({ senderPhone: 1, receivedAt: -1 });
WhatsAppMessageRecordSchema.index({ status: 1, receivedAt: -1 });
```
- **Rationale**: Meta webhook deduplication on provider `messageId`.

---

### 15. `auditlogs` & `notifications`
```ts
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ timestamp: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
```
