# NexusAdmin

> **Premium, reusable e-commerce admin panel.** Built for international freelance projects, agency builds and SaaS resale. Production-grade Next.js 16 / Prisma / Postgres / NextAuth v5 / shadcn/ui.

White-label-ready. Drop in your branding, plug in any Postgres, deploy to Vercel. Ship a complete commerce backoffice in a day.

---

## Highlights

- **9 fully built modules** — Dashboard, Products (with variants matrix + multi-image upload + CSV import/export), Categories (nested tree), Orders (status workflow + tracking + invoice + refunds), Customers (LTV + segments + address book), Promotions (coupons + flash sales + cart-side validator), Analytics (6 KPIs + 4 chart types + date range), Payments (gateway-agnostic with Stripe + PayPal stub + webhook log + simulator), Settings (store/team/API keys/email/theme/audit), Public Storefront API (Bearer auth + scopes + rate limit + checkout endpoint + OpenAPI spec)
- **RBAC** — 4 roles (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `VIEWER`) enforced at middleware, server action and UI layers
- **Auth** — NextAuth v5 (Credentials + Google OAuth + JWT sessions, no per-MAU cost)
- **Theme system** — light/dark + 6 primary-color presets, persisted per-user and per-store-default
- **Type-safe end-to-end** — TypeScript strict mode, Zod validations shared between client + server, Prisma-generated types
- **Production-ready** — loading skeletons + error boundaries on every route, audit log on every mutation, idempotent webhooks, atomic transactions, hashed API keys at rest
- **Developer-friendly** — OpenAPI 3.1 spec, Postman collection, dev-only webhook simulator, "Seed demo orders" button

---

## Tech stack (2026)

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router · React 19 · TypeScript strict |
| Styling | Tailwind v4 · shadcn/ui (new-york) |
| Theming | next-themes + CSS variables · 6 presets |
| ORM | Prisma 6 · Postgres (Supabase default) · SQLite for zero-config local |
| Auth | NextAuth v5 · bcrypt · Credentials + Google OAuth |
| Forms | React Hook Form + Zod resolver |
| Data | Server Components + Server Actions · TanStack Query (client) |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Uploads | Vercel Blob (with local `/public/uploads` dev fallback) |
| Payments | Stripe SDK + provider-agnostic interface, PayPal stub |
| Email | Resend (with console fallback) |
| Notifications | Sonner |
| i18n | next-intl ready (English seed) |

---

## Quick start

### 1. Install

```bash
pnpm install        # or npm install / yarn / bun
```

### 2. Environment

```bash
cp .env.example .env.local
# Generate AUTH_SECRET
openssl rand -base64 32
```

**Minimum env to boot**:

```bash
DATABASE_URL="file:./dev.db"          # or any Postgres URL
AUTH_SECRET="<generated>"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
```

### 3. Database

```bash
pnpm db:generate
pnpm db:migrate     # creates tables
pnpm db:seed        # super admin + sample data
```

### 4. Run

```bash
pnpm dev
# → http://localhost:3000
```

### Demo credentials (created by seed)

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@nexusadmin.dev` | `admin123` |
| Manager | `manager@nexusadmin.dev` | `admin123` |
| Viewer | `viewer@nexusadmin.dev` | `admin123` |

Sign in as different roles to see how the sidebar items, action buttons and data scopes change.

---

## Switching from SQLite (default) to Postgres

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Re-add Postgres-only field decorators (commented in the schema):
- `String? @db.Text` on long string fields (`description`, `notes`, `internalNotes`, `Account.refresh_token`/`access_token`/`id_token`)
- `String[]` on `ApiKey.scopes` (revert from `String` JSON)
- `Json` on `OrderItem.productSnapshot`, `Setting.value`, `AuditLog.diff`
- Add `previewFeatures = ["fullTextSearchPostgres"]` to generator (optional)

Then:

```bash
DATABASE_URL="postgresql://user:pwd@host:5432/db?pgbouncer=true"
DIRECT_URL="postgresql://user:pwd@host:5432/db"
pnpm db:migrate
pnpm db:seed
```

| Provider | DATABASE_URL example |
|---|---|
| **Supabase** | `postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| **Neon** | `postgresql://user:pwd@ep-xxx.region.neon.tech/db?sslmode=require` |
| **Local Docker** | `docker run --name nx -p 5432:5432 -e POSTGRES_PASSWORD=pass -d postgres:16` → `postgresql://postgres:pass@localhost:5432/postgres` |

---

## Modules at a glance

### Dashboard
4 KPI cards (Revenue / Orders / Customers / Conversion) · 7-day revenue area chart · low-stock alerts · recent orders feed.

### Products
Full CRUD with 6-tab editor (General / Pricing / Variants / Media / Organization / SEO) · cartesian-product variant matrix builder · drag-drop multi-image upload (Vercel Blob with local fallback) · nested category picker · tag autocomplete with on-the-fly creation · slug auto-generation · status workflow · CSV import/export with dry-run · row-selection bulk actions.

### Categories
Hierarchical tree view · inline edit dialog · cycle-protection on parent reassignment · cascade-aware delete (children become root, products lose link).

### Orders
Server-side filterable list (status × paymentStatus × date range × search) · 2-column detail view (items + totals + shipping + addresses + refunds; customer + payment + timeline) · status workflow guard (forward-only with allowed transitions) · tracking number + URL editor · refund dialog with refundable cap · print-styled invoice page (browser → PDF).

### Customers
Segment chips (All / New / Repeat / VIP / Marketing opt-in) · LTV-based VIP auto-detection · address book CRUD with default-address logic · profile page with stat cards + order history + notes.

### Promotions
Coupon CRUD (PERCENTAGE / FIXED / FREE_SHIPPING) with min purchase, max discount cap, usage + per-customer limits, scheduled start/expiry, ALL/PRODUCTS/CATEGORIES targeting · cart-side validator dialog · flash sales with time windows + product targeting · auto status badges (Inactive / Expired / Exhausted / Live now / Upcoming / Ended).

### Analytics
6 KPI cards (Gross / Net / Refunded / Paid orders / AOV / New customers + conversion) · revenue+orders dual-axis chart · order-status donut · top products bar · top categories progress bars · customer growth chart · 7d/30d/90d/365d preset chips + custom date inputs · CSV export.

### Payments
Provider-agnostic via `PaymentProvider` interface (Stripe wired, PayPal stub) · idempotent webhook dispatcher (auto-flips PENDING→PROCESSING on payment.succeeded, cascades order to REFUNDED on full refund) · webhook event log · gateway connection cards · admin reconciliation action · dev-only webhook simulator dropdown per row.

### Settings
6 tabs — Store profile (Identity / Localization / Tax / Address / Social) · Team (role manager + invite with reveal-once password) · API keys (bcrypt-hashed at rest, reveal-once plaintext, scope checkboxes, expiry, revoke) · Email (Resend connection badge) · Theme (6-preset grid with live preview + "Make default") · Audit log (last 50 with expandable JSON payload viewer).

### Public Storefront API
- `GET /products` `/products/:slug` `/categories` (scope `products:read` / `categories:read`)
- `POST /checkout` (scope `orders:write`) — full cart pipeline: variant validation, stock check, tax + coupon math, customer upsert, address creation, order + items + history, stock decrement, inventory log, coupon `usageCount` increment
- `GET /orders/:orderNumber?email=…` (scope `orders:read`) — email-gated tracking lookup
- All routes Bearer-auth, scope-checked, rate-limited (120/min/key), `X-RateLimit-*` headers
- `public/openapi.json` + `public/postman_collection.json` shipped

---

## RBAC matrix

| Action | SUPER_ADMIN | ADMIN | MANAGER | VIEWER |
|---|:-:|:-:|:-:|:-:|
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Store settings | ✅ | ✅ | ❌ | ❌ |
| Products write | ✅ | ✅ | ✅ | ❌ |
| Products delete | ✅ | ✅ | ❌ | ❌ |
| Orders write | ✅ | ✅ | ✅ | ❌ |
| Orders refund | ✅ | ✅ | ❌ | ❌ |
| Promotions write | ✅ | ✅ | ✅ | ❌ |
| Analytics view | ✅ | ✅ | ✅ | ✅ |
| API keys | ✅ | ❌ | ❌ | ❌ |

```ts
// In a Server Action
import { auth } from "@/server/auth";
import { requirePermission } from "@/lib/rbac";

export async function deleteProduct(id: string) {
  "use server";
  const session = await auth();
  requirePermission(session?.user?.role, "products:delete");
  // …
}

// In a Server Component
import { can } from "@/lib/rbac";
{can(session?.user?.role, "products:write") && <Button>New product</Button>}
```

---

## White-label / branding

One client, one rebrand:

1. **Name** — `Store.name` (singleton, edited in Settings → Store)
2. **Logo + favicon** — same row, paste hosted URLs
3. **Primary color** — Settings → Theme → Make default (or per-user picker in topbar)
4. **Default currency / locale / timezone** — Settings → Store → Localization
5. **Email sender** — Settings → Email
6. **Site config** — `src/config/site.ts` for fallback name/URL

That's it. No code changes for a new client.

---

## Adding a new module (e.g. "Brands")

1. **Schema** — `prisma/schema.prisma` add `model Brand { … }`, then `pnpm db:migrate`
2. **Validation** — `src/lib/validations/brand.ts` (Zod)
3. **Actions** — `src/server/actions/brand.ts` (`createBrand`, `updateBrand`, `deleteBrand` — wrap each in `requirePermission`)
4. **Page** — `src/app/(dashboard)/brands/page.tsx` (server component lists rows)
5. **Table** — `src/app/(dashboard)/brands/brands-table.tsx` (uses shared `<DataTable>`)
6. **Loading + error** — `loading.tsx` + `error.tsx` (3 lines each)
7. **Nav** — add entry to `src/config/nav.ts` with the right `permission`

Every module in the codebase follows this exact recipe.

---

## Public Storefront API

Quick start:

```bash
# 1. Generate an API key — Settings → API keys → New key → copy plaintext
KEY=nx_live_xxxxxxxxxxxxxxxxxxxxxxxxxxx

# 2. List products
curl -H "Authorization: Bearer $KEY" \
  "http://localhost:3000/api/public/v1/products?limit=20"

# 3. Create a checkout
curl -X POST -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{
    "customer": { "email": "buyer@example.com", "name": "Buyer" },
    "items": [{ "variantId": "<id>", "quantity": 1 }],
    "shippingAddress": {
      "line1": "100 Main St", "city": "NYC", "country": "US", "postalCode": "10001"
    },
    "couponCode": "WELCOME10",
    "shippingAmount": 500
  }' \
  http://localhost:3000/api/public/v1/checkout

# 4. Track an order
curl -H "Authorization: Bearer $KEY" \
  "http://localhost:3000/api/public/v1/orders/NX-2026-XXXXX?email=buyer@example.com"
```

OpenAPI spec at `public/openapi.json`, Postman at `public/postman_collection.json`.

Rate limit headers on every successful response:
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 119
X-RateLimit-Reset: 1778834898
```

---

## Folder layout

```
src/
├── app/
│   ├── (auth)/                     ← login / register / forgot / reset
│   ├── (dashboard)/                ← protected routes — sidebar shell
│   │   ├── page.tsx                  dashboard
│   │   ├── products/                 list + new + [id] edit + import
│   │   ├── categories/               nested tree CRUD
│   │   ├── orders/                   list + [id] detail + invoice
│   │   ├── customers/                list + new + [id] profile
│   │   ├── promotions/               coupons + flash sales tabs
│   │   ├── analytics/                6 KPIs + 4 charts
│   │   ├── payments/                 transactions + webhook log + gateways
│   │   ├── settings/                 6-tab settings hub
│   │   └── (each route has loading.tsx + error.tsx)
│   ├── api/
│   │   ├── auth/[...nextauth]/       NextAuth handler
│   │   ├── upload/                   Vercel Blob upload
│   │   ├── webhooks/stripe/          Stripe webhook (sig verify + dispatch)
│   │   └── public/v1/                Bearer-auth storefront API
│   ├── layout.tsx                    root + Providers (theme/query/session/toast)
│   ├── globals.css                   Tailwind + CSS vars
│   ├── error.tsx | not-found.tsx
├── components/
│   ├── ui/                           shadcn primitives (20+)
│   ├── layout/                       Sidebar / Topbar / ThemeProvider / ColorPicker / UserMenu
│   ├── data-table/                   reusable TanStack Table v8 wrapper
│   ├── forms/                        ImageUploader / VariantsEditor / CategoryPicker / TagsInput / MultiSelect
│   ├── charts/                       Revenue / OrdersRevenue / TopProducts / CustomerGrowth / StatusPie
│   └── modules/                      OrderStatusBadge / OrderTimeline / AddressCard / RefundDialog / ListSkeleton / RouteError / etc.
├── server/
│   ├── auth.ts                       NextAuth v5 config
│   ├── auth-handlers.ts              GET/POST exports
│   ├── db.ts                         Prisma singleton
│   ├── api-auth.ts                   Bearer verifier + rate limit
│   ├── actions/                      auth · products · categories · orders · customers · promotions · analytics · payments · settings
│   └── payments/                     types · stripe · paypal · index · dispatcher
├── lib/
│   ├── rbac.ts                       permission matrix + can() / requirePermission()
│   ├── utils.ts                      cn / formatCurrency / formatDate / slugify / generateOrderNumber
│   ├── blob.ts                       Vercel Blob + local fallback
│   ├── email.ts                      Resend wrapper + console fallback
│   ├── csv.ts                        Papa parse/unparse
│   ├── pdf/                          ready for react-pdf invoice generator
│   └── validations/                  shared Zod schemas
├── config/
│   ├── site.ts                       site name, URL
│   ├── nav.ts                        sidebar nav (per-permission gating)
│   └── theme-presets.ts              6 color presets
├── i18n/messages/en.json             next-intl ready
├── middleware.ts                     auth + route guards
└── types/
prisma/
├── schema.prisma                     all 24 models
└── seed.ts                           super admin + 3 demo users + 5 categories + 3 products + 3 coupons + 2 customers
public/
├── openapi.json                      OpenAPI 3.1 spec
└── postman_collection.json           ready Postman v2.1
scripts/
├── create-test-key.ts                dev API key generator
└── create-readonly-key.ts            scope-mismatch test helper
```

---

## Deploy to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full checklist. TL;DR:

1. Push to GitHub → Import to Vercel (auto-detects Next.js 16, Fluid Compute by default)
2. Add env vars (DATABASE_URL, DIRECT_URL, AUTH_SECRET, AUTH_URL, AUTH_TRUST_HOST, BLOB_READ_WRITE_TOKEN, RESEND_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, optional Google OAuth)
3. Override **Build Command**: `prisma migrate deploy && next build`
4. After first deploy, run `pnpm db:seed` against the prod DATABASE_URL once locally
5. Configure Stripe webhook → `https://<domain>/api/webhooks/stripe` for `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

---

## Scripts

```bash
pnpm dev               # dev server
pnpm build             # prod build
pnpm start             # start prod server
pnpm typecheck         # tsc --noEmit
pnpm lint              # next lint
pnpm db:generate       # prisma generate
pnpm db:migrate        # prisma migrate dev
pnpm db:deploy         # prisma migrate deploy (prod)
pnpm db:push           # prisma db push (skip migrations)
pnpm db:seed           # tsx prisma/seed.ts
pnpm db:studio         # open Prisma Studio
```

---

## Architecture decisions

- **Money in cents** end-to-end — UI converts on display, server stores integers, no floating-point rounding ever
- **Slug uniqueness auto-resolved** — `product`, `product-2`, `product-3`
- **Forward-only order workflow** — server-enforced state machine prevents skipping steps
- **Idempotent webhooks** — dispatcher checks AuditLog by `providerEventId`, retries safe
- **Atomic transactions** — checkout, refund, status updates all wrap in `db.$transaction`
- **Provider-agnostic payments** — `PaymentProvider` interface; add Square / Razorpay / Mollie without touching order code
- **Audit log** writes from every mutation, no opt-in needed
- **`productSnapshot` in OrderItem** — frozen at order time so historical orders survive product renames/deletes

---

## License

MIT — use, fork, sell, rebrand. Attribution appreciated, not required.

See [LICENSE](./LICENSE).

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, commit conventions and review process.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
