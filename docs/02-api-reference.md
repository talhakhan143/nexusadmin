# 02 — API reference

Two surfaces:
- **Internal Server Actions** — called from React components in the admin UI. Type-safe, no HTTP layer.
- **Public REST API** — called from external storefronts / mobile apps. Bearer-token auth.

---

## Server Actions (internal)

All under [`/src/server/actions/*`](../src/server/actions/). Every action:
- Validates input with Zod
- Calls `requirePermission(role, scope)` (throws on denial)
- Returns `{ ok: true, data?: T } | { ok: false, error: string }`
- Calls `revalidatePath()` to bust RSC cache
- Writes `AuditLog` for important mutations

### Auth — `actions/auth.ts`
- `loginAction(email, password)` — used by login form
- `registerAction({ name, email, password, confirmPassword })` — creates VIEWER user
- `forgotPasswordAction({ email })` — sends reset email (silent if email not found, prevents enumeration)
- `resetPasswordAction({ token, password, confirmPassword })` — single-use, 1-hour expiry

### Products — `actions/products.ts`
- `createProduct(input)` / `updateProduct(id, input)` — full payload, replaces nested children atomically
- `deleteProduct(id)` — best-effort blob cleanup
- `archiveProducts(ids[])` — bulk
- `setProductStatus(id, status)`
- `duplicateProduct(id)` — clones to `{name} (Copy)` as DRAFT
- `exportProductsCsv()` / `importProductsCsv(text, { dryRun })` — supports dry-run

### Categories — `actions/categories.ts`
- `createCategory` / `updateCategory` (with cycle-protection on parent reassignment) / `deleteCategory`
- `listTags` / `createTag` / `deleteTag`

### Orders — `actions/orders.ts`
- `updateOrderStatus(id, { status, note })` — workflow guard (forward-only):
  - PENDING → PROCESSING / CANCELLED
  - PROCESSING → SHIPPED / CANCELLED
  - SHIPPED → DELIVERED / REFUNDED
  - DELIVERED → REFUNDED
  - CANCELLED / REFUNDED → terminal
- `updateOrderTracking(id, { trackingNumber, trackingUrl })`
- `processRefund(id, { amount, reason })` — refundable cap, auto-cascades order status if fully refunded
- `exportOrdersCsv()`
- `seedDemoOrders()` — SUPER_ADMIN only, creates 6 demo orders

### Customers — `actions/customers.ts`
- `createCustomer` / `updateCustomer` / `deleteCustomer` (refuses if customer has orders)
- `addAddress(customerId, input)` / `updateAddress(id, input)` / `deleteAddress(id)` — auto-unsets prior `isDefault` when marking new
- `exportCustomersCsv()`
- `recomputeCustomerAggregates(customerId?)` — SUPER_ADMIN utility

### Promotions — `actions/promotions.ts`
- `createCoupon` / `updateCoupon` / `toggleCouponActive` / `deleteCoupon` (refuses if used)
- `validateCoupon(code, subtotal)` — cart-side preview, returns `{ discount, freeShipping, type, description }`
- `createFlashSale` / `updateFlashSale` / `toggleFlashSaleActive` / `deleteFlashSale`

### Analytics — `actions/analytics.ts`
- `getRevenueSeries(from, to)` — daily revenue + order count
- `getKpiSummary(from, to)` — gross/net revenue, AOV, conversion, etc.
- `getTopProducts(from, to, limit)`
- `getTopCategories(from, to, limit)`
- `getOrderStatusDistribution(from, to)`
- `getCustomerGrowth(from, to)` — new + cumulative
- `exportAnalyticsCsv(from, to)`

### Payments — `actions/payments.ts`
- `reconcilePayments(orderId?)` — recompute paymentStatus from refunds aggregate
- `simulateWebhook(orderId, type, amount?)` — SUPER_ADMIN dev tool

### Settings — `actions/settings.ts`
- `updateStore(input)`
- `createTeamUser` / `updateUserRole` / `toggleUserActive`
- `createApiKey(input)` — returns plaintext **once**
- `revokeApiKey(id)`
- `getEmailSettings` / `updateEmailSettings`
- `getDefaultTheme` / `setDefaultTheme(presetId)`

### Notifications — `actions/notifications.ts`
- `getNotifications()` — aggregates recent orders, low-stock variants, refunds, webhook events for the bell dropdown

---

## Public REST API

Base URL: `https://<your-domain>/api/public/v1`

### Authentication

Every request requires `Authorization: Bearer <api_key>`. Generate keys in the admin UI under Settings → API keys (SUPER_ADMIN only). Key format: `nx_live_<32-char-base64url>`.

Each key has a list of allowed **scopes**:
- `products:read`
- `products:write` (admin/internal use, not exposed via storefront API yet)
- `categories:read`
- `orders:read`
- `orders:write`
- `customers:read`
- `customers:write`
- `promotions:read`

### Rate limit

120 requests / minute / key. Headers on every successful response:
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 119
X-RateLimit-Reset: 1778834898    (Unix seconds)
```
On 429: includes `Retry-After: <seconds>`.

### Endpoints

| Method | Path | Scope | Notes |
|---|---|---|---|
| GET | `/products?limit=20&cursor=<id>&category=<slug>` | `products:read` | Cursor pagination, max `limit=100`. Returns `{ items, nextCursor }`. |
| GET | `/products/{slug}` | `products:read` | Full product with images, variants (with options), tags. |
| GET | `/categories` | `categories:read` | Flat list with `parentId` and `_count.products`. Build tree client-side. |
| POST | `/checkout` | `orders:write` | See payload below. Creates Customer (upsert), Addresses, Order, OrderItems, decrements stock, increments coupon usage. |
| GET | `/orders/{orderNumber}?email=<email>` | `orders:read` | **Email-gated** to prevent order-number scanning. Returns order detail + timeline. |

### Checkout request payload

```json
{
  "customer": {
    "email": "buyer@example.com",
    "name": "Buyer",
    "phone": "+1-555-0100",
    "acceptsMarketing": true
  },
  "items": [
    { "variantId": "cmp6j66fp...", "quantity": 2 }
  ],
  "shippingAddress": {
    "firstName": "Buyer",
    "lastName": "Smith",
    "line1": "100 Main St",
    "line2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "country": "US",
    "postalCode": "10001",
    "phone": "+1-555-0100"
  },
  "billingAddress": { /* same shape, optional — defaults to shipping */ },
  "couponCode": "WELCOME10",
  "shippingAmount": 500,           // cents
  "notes": "Leave at door"
}
```

### Checkout response (201)

```json
{
  "orderNumber": "NX-2026-35806",
  "id": "cmp6ocy0d...",
  "status": "PENDING",
  "paymentStatus": "PENDING",
  "currency": "USD",
  "subtotal": 39998,
  "taxAmount": 3000,
  "shippingAmount": 500,
  "discountAmount": 4000,
  "total": 39498,
  "checkoutUrl": null   // wired to Stripe Checkout in Phase 7
}
```

### Error codes

| HTTP | Reason |
|---|---|
| 400 | Validation error (Zod failure, missing variant, etc.) |
| 401 | Missing or invalid Bearer token |
| 403 | Token lacks required scope |
| 404 | Resource not found, or `/orders/{n}?email=…` mismatch |
| 409 | Conflict (out of stock, etc.) |
| 429 | Rate limit exceeded |

### OpenAPI

Full machine-readable spec: [`/public/openapi.json`](../public/openapi.json). Import into Postman, Insomnia, Stoplight, or generate clients via `openapi-generator`.
