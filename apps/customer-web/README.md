# Ksheeraam — Customer Web Application

The customer-facing web application for **Ksheeraam**, an Indian farm-fresh milk delivery and subscription platform delivering unadulterated milk to doorsteps before 7:00 AM every morning.

This application is located at `apps/customer-web` in the Ksheeraam monorepo.

---

## 🥛 Features & Capabilities

- **Flexible Milk Ordering**:
  - **Prepaid Recurring Subscriptions**: Daily, alternate-day, or custom weekly schedules (e.g. Mon, Wed, Fri).
  - **One-Time Pay-As-You-Go Deliveries**: Add to cart and receive next-morning drops.
- **Configurable Package Sizes**:
  - 500 ml food-grade eco-pouches.
  - 1 Litre UV-sterilized returnable glass bottles.
- **Authoritative Server Pricing**:
  - Real quotes requested from backend (`/orders/quote` and `/subscriptions/quote`).
  - No client-side price fabrication.
- **Subscription Lifecycle Management**:
  - Pause deliveries during vacations (with auto-resume date).
  - Resume subscriptions in 1 click.
  - Quantity modifications with cutoff logic (8:00 PM cutoff for next morning 7:00 AM delivery).
  - Plan cancellation with confirmation dialogs.
- **Delivery Address Management**:
  - Multiple locations (Home, Parents, Office, Villa).
  - Landmark, pincode validation, and special morning drop notes for riders.
- **Order Tracking & Live Status**:
  - Live timeline: *Placed → Confirmed & Chilled → Packed in UV Bottles → Out for Delivery → Delivered*.
  - Delivery partner details and contact action.
- **Billing, Invoices & Milk Wallet**:
  - Digital prepaid milk wallet with instant UPI top-ups.
  - GST tax invoices with FSSAI license (`#11223334000189`) and print support.
- **WhatsApp-Assisted Ordering**:
  - Configurable persistent floating WhatsApp concierge.
  - Generates pre-filled structured message templates for assisted orders.

---

## 🛠 Tech Stack

- **React 19** with **TypeScript**
- **Vite 8** (Fast bundler)
- **Tailwind CSS v3** (Curated dairy color palette, typography & glassmorphism)
- **React Router v7** (Nested layouts & ProtectedRoute authentication flow)
- **TanStack Query v5** (Server state, cache invalidation & optimistic UI)
- **Lucide React** (Modern iconography)

---

## 📁 Project Structure

```
apps/customer-web/
├── public/
│   └── favicon.svg                  # Brand milk droplet icon
├── src/
│   ├── config/
│   │   └── env.ts                   # Type-safe environment variable reader
│   ├── types/                       # Domain data contracts & API interfaces
│   │   ├── api.ts                   # ApiResponse<T>, ApiError, PaginatedResponse
│   │   ├── auth.ts                  # User, LoginCredentials, RegisterPayload
│   │   ├── products.ts              # Product, ProductVariant, PackageSize (500ml / 1L)
│   │   ├── subscriptions.ts         # Subscription, Quotes, Modification payloads
│   │   ├── orders.ts                # Order, TimelineStep, OrderQuote
│   │   ├── payments.ts              # PaymentTransaction, Invoice
│   │   └── addresses.ts             # Address, AddressType, CreateAddressPayload
│   ├── services/
│   │   ├── api-client.ts            # Centralized HTTP client (fetch + credentials: include)
│   │   ├── mock-adapter.ts          # Stateful mock API engine with latency simulation
│   │   └── mock-data.ts             # Realistic Indian dairy catalog, users & orders
│   ├── features/                    # Feature modules (API service + TanStack Query hooks)
│   │   ├── auth/                    # authApi.ts, AuthContext.tsx
│   │   ├── products/                # productsApi.ts, useProducts.ts
│   │   ├── subscriptions/           # subscriptionsApi.ts, useSubscriptions.ts
│   │   ├── orders/                  # ordersApi.ts, useOrders.ts
│   │   ├── payments/                # paymentsApi.ts, usePayments.ts
│   │   ├── addresses/               # addressesApi.ts, useAddresses.ts
│   │   └── cart/                    # CartContext.tsx (one-time & subscription basket)
│   ├── components/
│   │   ├── ui/                      # Button, Input, Select, Card, Badge, Modal, Alert, Spinner
│   │   ├── layout/                  # Header, Footer, MobileNav, Layout
│   │   └── common/                  # ModeIndicator, WhatsAppButton, OrderTimeline,
│   │                                # QuantitySelector, FrequencySelector, AddressSelector,
│   │                                # ProtectedRoute, LoadingState, ErrorState, EmptyState
│   ├── pages/                       # All customer pages
│   │   ├── HomePage.tsx             # / (Milk delivery landing page)
│   │   ├── ProductsPage.tsx         # /products (Catalog with size switchers)
│   │   ├── ProductDetailPage.tsx    # /products/:slug (Specs & subscription builder)
│   │   ├── LoginPage.tsx            # /login (Phone/email authentication)
│   │   ├── RegisterPage.tsx         # /register (Signup with bonus wallet credit)
│   │   ├── CheckoutPage.tsx         # /checkout (Quote summary & payment selection)
│   │   ├── SubscriptionsPage.tsx    # /subscriptions (List active/paused plans)
│   │   ├── SubscriptionDetailPage.tsx # /subscriptions/:id (Modify & pause plan)
│   │   ├── OrdersPage.tsx           # /orders (Order history)
│   │   ├── OrderDetailPage.tsx      # /orders/:id (Live status timeline & driver info)
│   │   ├── PaymentsPage.tsx         # /payments (Wallet ledger & GST invoices)
│   │   ├── ProfilePage.tsx          # /profile (Customer profile & preferences)
│   │   ├── AddressesPage.tsx        # /addresses (Delivery address management)
│   │   └── NotFoundPage.tsx         # 404 Not Found
│   ├── router/
│   │   └── AppRouter.tsx            # Routes configuration & scroll restoration
│   ├── utils/
│   │   ├── cn.ts                    # Classnames utility
│   │   └── formatters.ts            # INR currency (₹), dates, schedules, WhatsApp builder
│   ├── App.tsx                      # QueryClientProvider + AuthProvider + CartProvider
│   ├── main.tsx                     # React root mount
│   └── index.css                    # Tailwind directives & dairy visual utilities
├── .env                             # Active environment configuration
├── .env.example                     # Environment template
├── tailwind.config.js               # Dairy palette, typography & shadows
└── vite.config.ts                   # Vite bundler configuration with `@/` alias
```

---

## ⚙️ Environment Variables

Create or update `.env` in `apps/customer-web`:

```env
# Backend API Base URL (Express + Node.js API with MongoDB)
VITE_API_BASE_URL=http://localhost:5000/api/v1

# Toggle Mock Mode for Development (true = local stateful mock adapter, false = live backend API)
VITE_USE_MOCK_API=true

# Official WhatsApp Contact Number for Assisted Orders (international format, no + or dashes)
VITE_WHATSAPP_PHONE=919876543210

# Application Branding
VITE_APP_NAME=Ksheeraam
```

---

## 🔌 Connecting the Express + Node.js Backend

The frontend communicates with the backend via the centralized `src/services/api-client.ts` layer.

### Step 1: Switch from Mock to Live Mode
In `apps/customer-web/.env`, set:
```env
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Step 2: Express Server Requirements

Ensure your Express backend configures CORS to support credentials:
```typescript
import cors from 'cors';

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true, // Required for HTTP-only session cookies
  })
);
```

### Step 3: Required API Endpoints

The API expects the following endpoints under `/api/v1`:

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `GET` | `/auth/me` | Fetch authenticated user session |
| | `POST` | `/auth/login` | Login with phone/email and password/OTP |
| | `POST` | `/auth/register` | Register new customer account |
| | `POST` | `/auth/logout` | Clear session cookie / token |
| **Products** | `GET` | `/products` | List all dairy products (query: `category`, `search`) |
| | `GET` | `/products/:slug` | Retrieve single product details & variants |
| **Subscriptions** | `GET` | `/subscriptions` | List customer subscriptions |
| | `GET` | `/subscriptions/:id` | Subscription details |
| | `POST` | `/subscriptions/quote` | Calculate authoritative monthly quote |
| | `POST` | `/subscriptions` | Create recurring subscription |
| | `PATCH`| `/subscriptions/:id/modify` | Modify quantity, frequency, or schedule |
| | `POST` | `/subscriptions/:id/pause` | Pause deliveries between dates |
| | `POST` | `/subscriptions/:id/resume` | Resume paused deliveries |
| | `POST` | `/subscriptions/:id/cancel` | Cancel subscription |
| **Orders** | `GET` | `/orders` | List customer orders |
| | `GET` | `/orders/:id` | Order details & timeline |
| | `POST` | `/orders/quote` | Calculate authoritative price & fees quote |
| | `POST` | `/orders` | Create order |
| **Addresses** | `GET` | `/addresses` | List customer delivery addresses |
| | `POST` | `/addresses` | Add new address |
| | `PUT` | `/addresses/:id` | Update address |
| | `DELETE`| `/addresses/:id` | Delete address |
| **Billing** | `GET` | `/payments` | List payment ledger transactions |
| | `GET` | `/invoices` | List GST tax invoices |
| | `GET` | `/invoices/:id` | Single invoice details |
| | `POST` | `/payments/wallet-recharge` | Top up milk wallet balance |

---

## 🚀 Running the Project

### 1. From the Monorepo Root:
```bash
# Install dependencies
pnpm install

# Start customer web development server
pnpm dev
```

### 2. Standalone in `apps/customer-web`:
```bash
cd apps/customer-web
pnpm install
pnpm dev
```

The application will be running at `http://localhost:5173`.

### 3. Production Build:
```bash
pnpm build
```
Creates an optimized, type-checked bundle in `apps/customer-web/dist`.
