# 01 — Database schema

24 models. Source of truth: [`/prisma/schema.prisma`](../prisma/schema.prisma).

> **Default**: SQLite for zero-config local dev. **Production**: switch to Postgres (see [DEPLOYMENT.md](../DEPLOYMENT.md#switching-from-sqlite-default-to-postgres)).

## Domain map

```
                                    Store (singleton)
                                          │
                                          │
  User ─┬─ Account                        │
  (RBAC) ├─ Session                       │
        ├─ PasswordResetToken             │
        ├─ AuditLog                       │
        └─ ApiKey                         │
                                          │
  Customer ─┬─ Address                    │
            └─ Order ─┬─ OrderItem ◀──── Product ─┬─ ProductImage
                     ├─ OrderStatusHistory │     ├─ ProductVariant ─┬─ VariantOption
                     ├─ Refund             │     │                  └─ InventoryLog
                     └─ (coupon)           │     └─ ProductTag ──── Tag
                                           │
                                       Category (self-referential tree)
                                           │
  Coupon ─┬─ CouponProduct ─────────── Product
          └─ CouponCategory ────────── Category

  FlashSale ── FlashSaleProduct ────── Product

  Setting (kv store: theme.preset, email.settings, …)
```

## Models

### Auth + RBAC

| Model | Key fields | Notes |
|---|---|---|
| `User` | `email`, `hashedPassword`, `role` (enum) | Roles: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `VIEWER`. `lastLoginAt` updated on Credentials sign-in. |
| `Account` | NextAuth standard | OAuth provider linkage |
| `Session` | NextAuth standard | DB-backed (we use JWT, but adapter requires the table) |
| `VerificationToken` | NextAuth standard | Email magic-link verification |
| `PasswordResetToken` | `token`, `userId`, `expires`, `usedAt` | 1-hour expiry, single-use |

### Store

| Model | Key fields |
|---|---|
| `Store` | Singleton: `name`, `email`, `currency`, `locale`, `timezone`, `taxRate`, `taxIncluded`, address fields, social URLs |

### Catalog

| Model | Key fields | Relations |
|---|---|---|
| `Category` | `name`, `slug`, `parentId` (self-ref), `position`, SEO meta | M:N via `CouponCategory` |
| `Tag` | `name`, `slug` | M:N with Product via `ProductTag` |
| `Product` | `name`, `slug`, `description`, `sku`, `status` (`ACTIVE`/`DRAFT`/`ARCHIVED`), `basePrice` (cents), `compareAtPrice`, `costPrice`, `taxable`, `weight`, `trackInventory`, `featured`, `categoryId`, SEO meta | 1:N images, 1:N variants, M:N tags |
| `ProductImage` | `productId`, `url`, `alt`, `position` | Cascade delete with product |
| `ProductVariant` | `productId`, `sku`, `name`, `price`, `compareAtPrice`, `costPrice`, `stock`, `lowStockThreshold`, `weight`, `image`, `position` | 1:N options |
| `VariantOption` | `variantId`, `name` (e.g. "Color"), `value` (e.g. "Red") | Unique per `(variantId, name)` |
| `ProductTag` | Join: `productId` + `tagId` | Composite PK |
| `InventoryLog` | `variantId`, `change` (+/-), `reason` (enum), `note`, `userId` | Audit trail for stock movements |

### Customers

| Model | Key fields |
|---|---|
| `Customer` | `email` (unique), `name`, `phone`, `image`, `totalSpent` (cents), `ordersCount`, `acceptsMarketing`, `notes` |
| `Address` | `customerId`, `type` (`BILLING`/`SHIPPING`/`BOTH`), `firstName`, `lastName`, `company`, `line1`, `line2`, `city`, `state`, `country`, `postalCode`, `phone`, `isDefault` |

### Orders

| Model | Key fields | Notes |
|---|---|---|
| `Order` | `orderNumber` (unique, e.g. `NX-2026-12345`), `customerId`, `status` (`PENDING`/`PROCESSING`/`SHIPPED`/`DELIVERED`/`CANCELLED`/`REFUNDED`), `paymentStatus` (`PENDING`/`PAID`/`FAILED`/`REFUNDED`/`PARTIALLY_REFUNDED`), `paymentMethod` (`STRIPE`/`PAYPAL`/`COD`/`BANK_TRANSFER`/`OTHER`), `paymentRef`, `currency`, money fields (cents), `trackingNumber`, `trackingUrl`, `notes`, `internalNotes`, address FKs, `couponId`, lifecycle timestamps (`shippedAt`, `deliveredAt`, `cancelledAt`) | Forward-only status workflow enforced server-side |
| `OrderItem` | `orderId`, `productId`, `variantId`, `productSnapshot` (JSON string), `quantity`, `unitPrice`, `total` | **Snapshot frozen at order time** — survives product renames/deletes |
| `OrderStatusHistory` | `orderId`, `fromStatus`, `toStatus`, `changedById`, `note`, `createdAt` | Append-only |
| `Refund` | `orderId`, `amount`, `reason`, `status` (`PENDING`/`COMPLETED`/`FAILED`), `gatewayRef`, `processedById` | `gatewayRef` = provider's webhook event ID for idempotency |

### Promotions

| Model | Key fields | Notes |
|---|---|---|
| `Coupon` | `code` (unique, uppercase), `type` (`PERCENTAGE`/`FIXED`/`FREE_SHIPPING`), `value`, `minPurchase` (cents), `maxDiscount` (cents, caps %), `usageLimit`, `usageCount`, `perCustomerLimit`, `scope` (`ALL`/`PRODUCTS`/`CATEGORIES`), `startsAt`, `expiresAt`, `isActive` | Validated server-side by `validateCoupon()` |
| `CouponProduct`, `CouponCategory` | Join tables | Composite PKs |
| `FlashSale` | `name`, `startsAt`, `endsAt`, `discountType`, `discountValue`, `isActive` | Time-boxed campaigns |
| `FlashSaleProduct` | Join | |

### System

| Model | Key fields | Notes |
|---|---|---|
| `Setting` | `key`, `value` (JSON string for SQLite, native Json on Postgres) | KV store for `theme.preset`, `email.settings`, etc. |
| `ApiKey` | `name`, `hashedKey` (bcrypt), `prefix` (first 12 chars for display), `scopes` (JSON array), `lastUsedAt`, `expiresAt`, `createdById` | Plaintext shown ONCE at create time |
| `AuditLog` | `userId`, `action`, `entity`, `entityId`, `diff` (JSON string), `ip`, `userAgent`, `createdAt` | Idempotency dedup key for webhooks: `entity="Webhook"` + `entityId=providerEventId` |

## Indexes

Selected non-PK indexes:
- `Product.slug` UNIQUE, `Product.status`, `Product.categoryId`, `Product.featured`
- `Category.slug` UNIQUE, `Category.parentId`
- `Coupon.code` UNIQUE, `Coupon.isActive`
- `Order.orderNumber` UNIQUE, `Order.customerId`, `Order.status`, `Order.paymentStatus`, `Order.createdAt`
- `OrderItem.orderId`, `OrderItem.productId`
- `Customer.email` UNIQUE, `Customer.createdAt`
- `ProductVariant.productId`, `ProductVariant.stock`
- `InventoryLog.variantId`, `InventoryLog.createdAt`
- `AuditLog.userId`, `AuditLog.entity` + `entityId`, `AuditLog.createdAt`
- `ApiKey.hashedKey` UNIQUE, `ApiKey.prefix` (lookup index)

## Cascading deletes

Set explicitly via `onDelete: Cascade` where appropriate:
- `Product` → ProductImage, ProductVariant (and via variant → VariantOption, InventoryLog)
- `Order` → OrderItem, OrderStatusHistory, Refund
- `Coupon` → CouponProduct, CouponCategory
- `Customer` → Address (all customer addresses removed)
- `User` → Account, Session, PasswordResetToken

`SetNull` (preserves child row, blanks the FK):
- `Product.categoryId` if Category deleted
- `OrderItem.productId/variantId` if Product/Variant deleted (snapshot still lives)
- `Order.customerId` if Customer deleted
- `User`-references in `OrderStatusHistory.changedById`, `Refund.processedById`, `InventoryLog.userId`, `ApiKey.createdById`, `AuditLog.userId`
