# Ksheeraam Operations, Backups & Production Runbook

This document details the operational standards, disaster recovery procedures, logging specifications, and deployment readiness guidelines for the Ksheeraam MERN platform.

---

## 1. Database Indexing & Concurrency Architecture

All database collections are governed by the specifications in [DATABASE_INDEXES.md](file:///d:/Ksheeram-Frontend/docs/DATABASE_INDEXES.md).

### Key Concurrency Invariants
1. **Inventory Balance Uniqueness**:
   `{ productId: 1, size: 1, packagingType: 1 }` (unique compound index).
   Guarantees that stock cannot be fragmented across multiple documents.
2. **Atomic Inventory Reservation**:
   ```ts
   InventoryBalanceModel.findOneAndUpdate(
     {
       _id: balanceId,
       $expr: { $gte: [{ $subtract: ['$physicalUnits', '$reservedUnits'] }, quantity] }
     },
     {
       $inc: { reservedUnits: quantity },
       $set: { lastUpdated: new Date() }
     }
   );
   ```
   Ensures zero race conditions when concurrent orders compete for limited stock.
3. **Daily Subscription Order Idempotency**:
   `{ subscriptionId: 1, deliveryDate: 1 }` (unique compound index).
   Prevents double order generation and duplicate wallet charges if cron jobs retry or execute concurrently.
4. **Payment Gateway Webhook Idempotency**:
   `{ gatewayTxnId: 1 }` & `{ idempotencyKey: 1 }` (unique indexes).
   Prevents double credit on webhook delivery retries from payment providers.

---

## 2. Error Handling & Standard Response Contract

All backend routes pipe errors through a centralized error middleware (`src/middleware/error-handler.ts`).

### Response Envelope
```json
{
  "success": false,
  "message": "Human-readable error explanation",
  "code": "MACHINE_READABLE_CODE",
  "requestId": "uuid-v4-correlation-id",
  "timestamp": "2026-10-11T00:50:00.000Z"
}
```

### HTTP Status Code Standards
- **400 Bad Request**: Validation failures (`VALIDATION_ERROR`), insufficient wallet funds (`INSUFFICIENT_WALLET_BALANCE`).
- **401 Unauthorized**: Missing session token (`UNAUTHENTICATED`), invalid/expired token (`TOKEN_INVALID`), invalid webhook HMAC signature (`INVALID_SIGNATURE`).
- **403 Forbidden**: Cross-customer access attempts, cross-agent manifest access attempts, unauthorized roles (`FORBIDDEN`).
- **404 Not Found**: Non-existent resource (`NOT_FOUND`).
- **409 Conflict**: Stock shortage during reservation (`INSUFFICIENT_STOCK`), duplicate unique key collisions (`DUPLICATE_KEY`).
- **500 Internal Server Error**: Unhandled application exceptions.

---

## 3. Structured Logging & Observability

### Correlation ID
Every HTTP request generates a unique correlation ID via `x-request-id` header or standard UUID v4. This ID is attached to:
- Express Request context (`req.id`)
- Server response headers (`x-request-id`)
- Structured log lines and error responses

### Audit Trail Logging
Critical operational actions are recorded to the `auditlogs` collection:
- Stock adjustments and damage write-offs
- Manual agent route reassignments
- Delivery completion and COD cash reconciliations
- Administrative customer wallet modifications

---

## 4. Backup & Disaster Recovery Strategy

### 1. MongoDB Atlas Automated Continuous Backups
- **Continuous Point-in-Time Recovery (PITR)**: 7-day rolling window with 1-minute granularity for point-in-time restore.
- **Scheduled Snapshots**:
  - Daily snapshots retained for 30 days.
  - Weekly snapshots retained for 12 weeks.
  - Monthly snapshots retained for 12 months.

### 2. Standalone / Self-Hosted MongoDB Backup Script
For staging or local backups:
```bash
#!/bin/bash
# ksheeraam-backup.sh
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/ksheeraam/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

mongodump --uri="$MONGODB_URI" --gzip --out="$BACKUP_DIR"
echo "Backup completed successfully at $BACKUP_DIR"

# Retain 14 days of local backups
find /var/backups/ksheeraam/ -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +
```

### 3. Restore Verification Protocol
- Bi-weekly automated restore test into a staging sandbox to verify data integrity and index rebuilding.
- RPO (Recovery Point Objective): < 5 minutes.
- RTO (Recovery Time Objective): < 30 minutes.

---

## 5. Production Environment Configuration

All sensitive secrets must be supplied via secure secret management (e.g., Doppler, AWS Secrets Manager, or Kubernetes Secrets). **Never commit production secrets to Git.**

| Variable | Description | Required In |
|---|---|---|
| `NODE_ENV` | `production` | api-server |
| `PORT` | API Server port (default: 5000) | api-server |
| `MONGODB_URI` | MongoDB Atlas replica set URI with TLS | api-server |
| `JWT_SECRET` | 256-bit cryptographically random key | api-server |
| `COOKIE_SECRET` | 256-bit cryptographically random key | api-server |
| `WEBHOOK_SECRET` | Payment gateway HMAC webhook secret | api-server |
| `WHATSAPP_VERIFY_TOKEN` | Meta WhatsApp Cloud API verify token | api-server |
| `CORS_ORIGIN` | Comma-separated allowed frontend domains | api-server |
| `VITE_API_BASE_URL` | Full public URL to API (e.g. `https://api.ksheeraam.com/api/v1`) | customer-web, admin-web |
| `VITE_USE_MOCK_API` | `false` | customer-web, admin-web |
