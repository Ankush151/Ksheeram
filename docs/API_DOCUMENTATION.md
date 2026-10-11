# Ksheeraam Backend REST API Documentation

Base URL: `http://localhost:5000/api/v1`

All requests and responses use JSON format.
All monetary amounts are represented in **integer paise** (`100 paise = 1 INR`).
All date keys are canonical strings in `Asia/Kolkata` (`YYYY-MM-DD`).

---

## 1. Authentication & Security

- **Session Format**: HTTP-only secure cookie `ksheeraam_token` or `Authorization: Bearer <token>` header.
- **Roles**:
  - `customer`: Customer portal access for self-service orders, subscriptions, wallet, and addresses.
  - `admin`: Full operations, inventory, suppliers, procurement, reports, user management.
  - `delivery_agent`: Delivery manifest viewing, status updates, COD cash collection notes.
- **Request Tracing**: Every response includes `requestId` (`x-request-id` header).

---

## 2. API Endpoints

### 2.1 Authentication (`/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new customer or agent account |
| `POST` | `/auth/login` | Public | Login with phone/email and password (or OTP) |
| `POST` | `/auth/logout` | Public | Clear HTTP-only session cookie |
| `GET` | `/auth/me` | Authenticated | Retrieve current authenticated user profile |

#### Request Example: `POST /auth/register`
```json
{
  "name": "Pooja Hegde",
  "phone": "9876543210",
  "email": "pooja@example.com",
  "password": "Password123"
}
```

---

### 2.2 Users & Addresses (`/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/users` | Admin | List all registered users (filterable by role) |
| `GET` | `/users/:id` | Authenticated | Get user details by ID |
| `GET` | `/users/me/addresses` | Customer | List authenticated customer's addresses |
| `POST` | `/users/me/addresses` | Customer | Add a new delivery address |
| `PUT` | `/users/me/addresses/:id` | Customer | Update an existing delivery address |
| `DELETE` | `/users/me/addresses/:id` | Customer | Remove a delivery address |

#### Request Example: `POST /users/me/addresses`
```json
{
  "label": "Home",
  "flatNumber": "Flat 402",
  "buildingName": "Gulmohar Enclave",
  "streetArea": "12th Main Road, Indiranagar",
  "landmark": "Near ESI Hospital",
  "city": "Bangalore",
  "pincode": "560038",
  "isDefault": true,
  "deliveryInstructions": "Leave in door drop bag"
}
```

---

### 2.3 Product Catalog & Pricing (`/products`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/products` | Public | List products (filter: `category`, `all=true`) |
| `GET` | `/products/:id` | Public | Get product by ID |
| `GET` | `/products/slug/:slug` | Public | Get product by URL slug |
| `POST` | `/products` | Admin | Create a new dairy product with variants |
| `PUT` | `/products/:id` | Admin | Update product details and prices |

---

### 2.4 Suppliers & Procurement (`/suppliers`, `/procurement`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/suppliers` | Admin | List all registered dairy farm suppliers |
| `POST` | `/suppliers` | Admin | Register a new supplier farm |
| `PUT` | `/suppliers/:id` | Admin | Update supplier profile |
| `GET` | `/procurement` | Admin | List purchase orders |
| `POST` | `/procurement` | Admin | Issue a new dock purchase order |
| `POST` | `/procurement/receive` | Admin | Receive dock delivery, record chilling temp, and inward stock |

#### Request Example: `POST /procurement/receive`
```json
{
  "poId": "651f1234abcd...",
  "chillingTemp": "3.8°C",
  "qualityTesterName": "Anil Kumar",
  "items": [
    {
      "itemId": "651f1234abcd...",
      "receivedUnits": 148,
      "rejectedUnits": 2,
      "rejectionReason": "Temperature above 6°C"
    }
  ]
}
```

---

### 2.5 Packaged-Unit Inventory (`/inventory`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/inventory` | Admin, Agent | List inventory balances (physical, reserved, available) |
| `GET` | `/inventory/movements` | Admin | Audit trail of all stock movements |
| `POST` | `/inventory/adjust` | Admin | Manual adjustment (`add_stock`, `mark_damaged`, `audit_adjustment`) |

---

### 2.6 Subscriptions (`/subscriptions`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/subscriptions` | Authenticated | List subscriptions (customer own, or admin all) |
| `GET` | `/subscriptions/:id` | Authenticated | Get subscription details |
| `POST` | `/subscriptions` | Customer | Create recurring subscription (`daily`, `alternate`, `custom`) |
| `POST` | `/subscriptions/:id/pause` | Authenticated | Pause delivery for date range |
| `POST` | `/subscriptions/:id/resume` | Authenticated | Resume paused subscription |
| `POST` | `/subscriptions/:id/cancel` | Authenticated | Cancel subscription |
| `PUT` | `/subscriptions/:id/schedule` | Authenticated | Update schedule effective from a date |

#### Request Example: `POST /subscriptions`
```json
{
  "frequency": "daily",
  "items": [
    {
      "productId": "651f123...",
      "size": "1L",
      "quantity": 1
    }
  ],
  "addressId": "651f987...",
  "startDate": "2026-10-15"
}
```

---

### 2.7 Orders & Checkout (`/orders`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/orders/quote` | Authenticated | Calculate server-side checkout quote in paise |
| `POST` | `/orders` | Authenticated | Place one-time order with stock reservation |
| `GET` | `/orders` | Authenticated | List orders (customer own, agent assigned, admin all) |
| `GET` | `/orders/:id` | Authenticated | Get order details |
| `POST` | `/orders/generate-daily` | Admin | Trigger daily subscription order generation job |

---

### 2.8 Delivery Operations (`/delivery`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/delivery/manifest` | Admin, Agent | View daily delivery manifest for a date |
| `POST` | `/delivery/assign` | Admin | Assign route orders to a delivery agent |
| `POST` | `/delivery/complete` | Admin, Agent | Mark doorstep drop completed, record COD cash collected |
| `POST` | `/delivery/fail` | Admin, Agent | Mark drop failed with reason (breakage, locked door) |

---

### 2.9 Billing & Invoices (`/billing`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/billing/invoices` | Authenticated | List tax invoices |
| `GET` | `/billing/invoices/:id` | Authenticated | Get invoice by ID |
| `GET` | `/billing/ledger` | Authenticated | View customer prepaid wallet ledger entries |
| `POST` | `/billing/topup` | Customer | Recharge prepaid wallet balance |
| `POST` | `/billing/webhook` | Gateway | Secure webhook endpoint with HMAC SHA256 verification |
| `GET` | `/billing/alerts` | Admin | View COD cash shortages and gateway reconciliation alerts |

---

### 2.10 WhatsApp Business Cloud API (`/whatsapp`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/whatsapp/webhook` | Meta Cloud API | Webhook verification handshake with verify token |
| `POST` | `/whatsapp/webhook` | Meta Cloud API | Receive inbound messages with deduplication |
| `GET` | `/whatsapp/messages` | Admin | View incoming WhatsApp conversational leads |
| `POST` | `/whatsapp/messages/:id/convert` | Admin | Convert conversational chat into confirmed order |
| `POST` | `/whatsapp/messages/:id/dismiss` | Admin | Dismiss WhatsApp message |

---

### 2.11 Reports & System Probes (`/reports`, `/health`, `/ready`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/reports/daily` | Admin | Aggregated daily metrics (procurement, fulfillment, revenue paise) |
| `GET` | `/reports/audit-logs` | Admin | Audit trail of sensitive system actions |
| `GET` | `/health` | Public | Liveness probe with uptime and service status |
| `GET` | `/ready` | Public | Readiness probe with MongoDB database connectivity |
