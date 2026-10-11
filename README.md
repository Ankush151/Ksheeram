# Ksheeraam — Production MERN Monorepo for Milk Delivery

A production-conscious monorepo for **Ksheeraam**, an Indian farm-fresh milk delivery and recurring subscription business.

The repository supports two independently deployable React 19 web applications, one shared Node.js backend modular monolith backed by MongoDB Atlas, and shared TypeScript contract and UI packages.

---

## 1. Monorepo Architecture

Managed via **pnpm workspaces**:

```
.
├── apps/
│   ├── customer-web/            # Customer React 19 + TypeScript + Vite website (Port 5173)
│   ├── admin-web/               # Admin & Delivery-Agent React 19 + Vite portal (Port 5174)
│   └── api-server/              # Node.js + Express + TypeScript + Mongoose modular monolith (Port 5000)
├── packages/
│   ├── contracts/               # Shared TypeScript API contracts, DTOs, domain enums, money utils
│   └── ui/                      # Shared design tokens, brand badges, and palette constants
├── docs/
│   ├── API_DOCUMENTATION.md     # Full REST API specification with endpoints and schemas
│   └── DATABASE_INDEXES.md      # MongoDB Atlas collections, schemas, and compound unique indexes
├── pnpm-workspace.yaml          # Workspace package layout & build dependencies
└── package.json                 # Monorepo development, build, and test scripts
```

---

## 2. Core Architectural Principles

1. **Modular Monolith**:
   - Backend logic is strictly partitioned into modules (`auth`, `users`, `products`, `suppliers`, `procurement`, `inventory`, `subscriptions`, `orders`, `order-generator`, `delivery`, `billing`, `whatsapp`, `reports`, `notifications`).
   - Business logic lives strictly in services. Controllers only handle HTTP concerns and never implement complex workflows.
2. **Money Precision**:
   - Stored strictly in **integer paise** (`1 INR = 100 paise`). Floating-point arithmetic for currency is strictly prohibited.
3. **Inventory Management**:
   - Measured in **integer packaged units** (500ml and 1L glass bottles / pouches).
   - Concurrency-safe atomic reservations using MongoDB `$expr: { $gte: [{ $subtract: ['$physicalUnits', '$reservedUnits'] }, quantity] }`.
4. **Canonical Timezone**:
   - Delivery date keys strictly use canonical strings in `Asia/Kolkata` (`YYYY-MM-DD`).
5. **Scheduled Order Generation**:
   - Runs daily to process eligible subscriptions for the next delivery day.
   - **Idempotency Guarantee**: Backed by a compound unique index `{ subscriptionId: 1, deliveryDate: 1 }` preventing duplicate orders, double wallet debits, or double stock reservations upon retries.
6. **Authentication & RBAC**:
   - Secure browser authentication using HTTP-only cookies (`ksheeraam_token`) with Bearer token fallback.
   - Enforces strict role isolation for `customer`, `delivery_agent`, and `admin`. Identities and roles are derived server-side from verified sessions and never trusted from frontend input.
7. **WhatsApp Business Cloud API**:
   - Official Meta Cloud webhook integration with provider `messageId` deduplication, conversational intent detection, customer phone resolution, and STOP opt-out compliance.
   - Ambiguous messages can be converted by admins into confirmed orders using the shared order service.

---

## 3. Quick Start

### Prerequisites
- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 9.0.0`
- **MongoDB**: Local MongoDB instance (or MongoDB Atlas cluster connection string)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` in each application:
```bash
# Backend API Server
cp apps/api-server/.env.example apps/api-server/.env

# Customer Web
cp apps/customer-web/.env.example apps/customer-web/.env

# Admin Web
cp apps/admin-web/.env.example apps/admin-web/.env
```

### 3. Seed Development Database
Populate non-production demo catalog, suppliers, initial inventory, active subscriptions, and test accounts:
```bash
pnpm seed
```

**Seed Test Accounts (Password for all: `Ksheeraam@123`):**
| Role | Email | Phone | Description |
|---|---|---|---|
| **Admin** | `admin@ksheeraam.com` | `9876543210` | Full administrative operations |
| **Delivery Agent** | `agent@ksheeraam.com` | `9876543211` | Indiranagar morning route rider |
| **Customer** | `customer@ksheeraam.com` | `9876543212` | Customer with ₹2,500 wallet balance |

### 4. Run Test Suite
Executes 33 comprehensive unit and integration tests across RBAC, schedule calculations, duplicate order idempotency, concurrent stock reservation, webhook verification, and end-to-end lifecycle:
```bash
pnpm test
```

### 5. Run Development Servers
```bash
# Run all services concurrently
pnpm dev:api       # API Server on http://localhost:5000 (Health: /health)
pnpm dev:customer  # Customer Web on http://localhost:5173
pnpm dev:admin     # Admin Portal on http://localhost:5174
```

### 6. Build Entire Monorepo for Production
```bash
pnpm build
```

---

## 4. Documentation Links

- 📘 [Backend REST API Documentation](./docs/API_DOCUMENTATION.md)
- 🗄️ [Database Schema & Unique Index Architecture](./docs/DATABASE_INDEXES.md)
- 🥛 [Customer Website Readme](./apps/customer-web/README.md)
- 🚚 [Admin & Delivery Portal Readme](./apps/admin-web/README.md)
