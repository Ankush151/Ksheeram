# Ksheeraam — Admin & Delivery Partner Portal (`@ksheeraam/admin-web`)

Production-ready administrative and delivery-agent frontend for the **Ksheeraam** packaged milk delivery business in India.

Built with **React 19**, **TypeScript**, **Vite 8**, **React Router v7**, **Tailwind CSS v3**, and **TanStack Query v5**.

---

## 1. Overview & Architecture

Ksheeraam procures milk from regional dairy suppliers, packages it into saleable units (500ml pouches & 1L glass bottles), and fulfills both prepaid subscriptions and one-time pay-as-you-go customer orders.

This application provides role-separated interfaces:
1. **Administrative Operations Console (`/admin/*`)**: For depot managers, dispatch coordinators, and inventory auditors.
2. **Delivery Agent Mobile Interface (`/delivery/*`)**: For delivery agents on routes fulfilling morning milk drops, recording cash-on-delivery (COD) handovers, or logging delivery exceptions.

> [!IMPORTANT]
> **Zero Browser Database Access:** The application contains **no** direct MongoDB, Supabase, or Firebase SDK dependencies. All business operations, authoritative stock calculations, and role-based permissions are mediated through a centralized typed Express REST client.

---

## 2. Role-Based Route Architecture

Frontend route guards enforce navigation workflows, while the Express backend retains authoritative authentication via JWT / HTTP-only cookies.

### Admin Routes (`/admin`)
| Route | Component | Purpose |
|---|---|---|
| `/admin/dashboard` | `AdminDashboardPage` | Real-time operations metrics, today's drop tally, pending stock allocation alerts, low-stock warnings, and tomorrow's procurement forecast. |
| `/admin/customers` | `CustomersPage` | Customer directory, wallet balances, subscription statuses, and address summaries. |
| `/admin/products` | `ProductsPage` | Catalog of milk products, fat/SNF specs, chilling temperatures, and packaged unit prices. |
| `/admin/suppliers` | `SuppliersPage` | Partner dairy farms, supply capacities, chilling ratings, and bank payout terms. |
| `/admin/procurement` | `ProcurementPage` | Purchase order (PO) issuing, dock intake QC verification (chilling &le; 4.0&deg;C), and packaged units inventory receipt. |
| `/admin/inventory` | `InventoryPage` | Packaged-unit stock ledger: Physical, Reserved, Available, and Damaged units with controlled adjustment forms and movement audit logs. |
| `/admin/subscriptions` | `SubscriptionsPage` | Subscriber schedules (Daily, Alternate, Custom), next delivery dates, prepaid wallet balance sufficiency, and pause/resume controls. |
| `/admin/orders` | `OrdersPage` | Order search & filter, item inspection, and stock allocation trigger for unallocated drops. |
| `/admin/deliveries` | `DeliveryManifestPage` | Route manifest, live route progress bar, agent assignments, and failed delivery reviews. |
| `/admin/billing` | `BillingPage` | Tax invoice statements, cycle billing breakdowns, and collections ledger. |
| `/admin/payments` | `PaymentsReconciliationPage` | Detection of cash-on-delivery shortfalls and payment gateway discrepancy audits. |
| `/admin/whatsapp` | `WhatsAppRequestsPage` | Inbound WhatsApp chatbot orders and subscription adjustments with 1-click WhatsApp web links and order conversion. |
| `/admin/reports` | `ReportsPage` | Daily reconciliation table, shrinkage/leakage rate tracking, and CSV export. |
| `/admin/settings` | `SettingsPage` | 8:00 PM cutoff deadline, cold room temperature thresholds, FSSAI / GSTIN numbers, and backend API status. |

### Delivery Partner Routes (`/delivery`)
| Route | Component | Purpose |
|---|---|---|
| `/delivery/manifest` | `AgentManifestPage` | Assigned route drops only, pending vs completed filter, package unit counts, and 1-tap quick completion/failure actions. |
| `/delivery/orders/:id` | `AgentOrderDetailPage` | Detailed drop screen with customer address, Google Maps link, phone call action, COD collection target, and handover notes. |
| `/delivery/history` | `AgentHistoryPage` | Shift history log and COD cash-in-hand tally ready for supervisor handover. |
| `/delivery/profile` | `AgentProfilePage` | Rider identity, vehicle number, assigned sector, dispatch helpline, and shift sign-off. |

### Public & Authentication Routes
| Route | Component | Purpose |
|---|---|---|
| `/login` | `LoginPage` | Phone/password authentication with quick 1-click demo buttons for Admin and Delivery Agent. |
| `/unauthorized` | `UnauthorizedPage` | Friendly error page if a role violates route access constraints. |

---

## 3. Environment Configuration

Create a `.env` file in `apps/admin-web`:

```bash
# Backend Express API Base URL
VITE_API_BASE_URL=http://localhost:5000/api/v1

# Mode Toggle: Set to 'false' to connect to live Express + MongoDB backend
VITE_USE_MOCK_API=true
```

### Switching between Mock and Live Express API
- **`VITE_USE_MOCK_API=true` (Default)**: Uses the stateful mock engine (`src/services/mock-adapter.ts`). Simulates full business flows including PO creation, dock intake auto-incrementing inventory, and route dispatch without needing a local database running.
- **`VITE_USE_MOCK_API=false`**: Sends real Bearer token HTTP requests with `credentials: 'include'` to your Express + MongoDB server at `VITE_API_BASE_URL`.

---

## 4. Quick Start & Development

From the repository root (`d:\Ksheeram-Frontend`):

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Admin & Delivery Portal Dev Server
```bash
pnpm --filter @ksheeraam/admin-web dev
```
Portal will be active on **[http://localhost:5174](http://localhost:5174)**.

*(Note: Customer web portal runs simultaneously on port 5173).*

### 3. Build for Production
```bash
pnpm --filter @ksheeraam/admin-web build
```
Build bundle is generated in `apps/admin-web/dist/`.

---

## 5. Testing Credentials

For fast review without manual typing, the login screen provides 1-click launcher buttons:

| Role | Name | Phone / Login | Scope |
|---|---|---|---|
| **Admin** | Rajesh Varma | `9845011223` | Full access to `/admin/*` operations, inventory, and finance |
| **Delivery Agent** | Ramesh Kumar | `9845012345` | Access to `/delivery/*` (Bellandur & Sarjapur Sector 1 route) |
| **Delivery Agent** | Suresh Gowda | `9845098765` | Access to `/delivery/*` (HSR Layout & Koramangala Sector 2 route) |

---

## 6. Directory Structure

```
apps/admin-web/
├── src/
│   ├── components/
│   │   ├── layout/            # AdminLayout, DeliveryLayout, RouteGuard
│   │   └── ui/                # Button, Badge, Card, Modal, Input, Select, ConfirmationDialog, Spinner, Alert
│   ├── config/                # Environment variables parser
│   ├── features/              # Feature API services
│   │   ├── auth/              # AuthContext & login service
│   │   ├── billing/           # Invoices & payment reconciliation
│   │   ├── customers/         # Customer directory
│   │   ├── dashboard/         # Operations stats
│   │   ├── delivery/          # Route manifests & drop actions
│   │   ├── inventory/         # Packaged units & audit adjustments
│   │   ├── orders/            # Orders & stock allocation
│   │   ├── procurement/       # POs, intake & cold chain QC
│   │   ├── products/          # Products catalog
│   │   ├── reports/           # Daily operational reports
│   │   ├── subscriptions/     # Recurring subscriptions
│   │   ├── suppliers/         # Dairy suppliers
│   │   └── whatsapp/          # WhatsApp customer requests
│   ├── pages/
│   │   ├── admin/             # 14 Admin management screens
│   │   ├── delivery/          # 4 Delivery agent screens
│   │   ├── LoginPage.tsx
│   │   └── UnauthorizedPage.tsx
│   ├── router/                # React Router v7 configuration
│   ├── services/              # API client, Mock adapter & seed datasets
│   ├── types/                 # Strict TypeScript domain interfaces
│   └── utils/                 # Currency formatters & clsx helper
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```
