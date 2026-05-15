# 00 — Architecture

## Stack rationale

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router + React 19 | Server Components = no waterfall, Server Actions = no API layer for internal mutations, Fluid Compute on Vercel = warm function instances |
| Language | TypeScript strict | Catches issues at build time; Prisma + Zod give end-to-end inference |
| Styling | Tailwind v4 + shadcn/ui | Headless primitives we own (in `/components/ui`), no vendor lock-in |
| ORM | Prisma 6 | Type-safe, migration-first, works equally on Postgres and SQLite |
| Auth | NextAuth v5 | Free, no per-MAU cost (matters for resellable product), JWT sessions reduce DB load |
| Forms | RHF + Zod resolver | Schema-shared between client + server (`/lib/validations`) |
| Tables | TanStack Table v8 | Most extensible table primitive, server-side pagination via Next.js `searchParams` |
| Charts | Recharts | SVG, accessible, extends Tailwind theme via CSS vars |
| Uploads | Vercel Blob with local fallback | Native to Vercel; `/public/uploads` fallback when no token |
| Payments | Provider-agnostic interface | Stripe wired, PayPal stub, swap without touching order code |

## Folder layout

```
src/
├── app/                         Next.js App Router
│   ├── (auth)/                  Public auth routes (login, register, forgot, reset)
│   ├── (dashboard)/             Protected routes — sidebar shell
│   │   ├── layout.tsx           Auth gate + DashboardShell wrapper
│   │   ├── page.tsx             Dashboard
│   │   ├── products/            Module: list, new, [id], import
│   │   ├── categories/          Module
│   │   ├── orders/              Module: list, [id], [id]/invoice
│   │   ├── customers/           Module: list, new, [id]
│   │   ├── promotions/          Module
│   │   ├── analytics/           Module
│   │   ├── payments/            Module
│   │   ├── settings/            Module: 6 tabs
│   │   └── (each route ships loading.tsx + error.tsx)
│   ├── api/
│   │   ├── auth/[...nextauth]/  NextAuth handler
│   │   ├── upload/              File upload (RBAC-gated)
│   │   ├── webhooks/stripe/     Stripe webhook receiver
│   │   └── public/v1/           Bearer-auth REST API
│   ├── layout.tsx               Root + Providers
│   ├── globals.css              Tailwind + CSS vars
│   ├── error.tsx | not-found.tsx
├── components/
│   ├── ui/                      shadcn primitives (Button, Card, Dialog, …)
│   ├── layout/                  Sidebar, Topbar, ThemeProvider, ColorPicker, NotificationsMenu
│   ├── data-table/              Reusable TanStack Table v8 wrapper
│   ├── forms/                   ImageUploader, VariantsEditor, MultiSelect, …
│   ├── charts/                  Recharts wrappers
│   └── modules/                 Cross-module widgets (PageHeader, OrderStatusBadge, …)
├── server/
│   ├── auth.ts                  NextAuth v5 config
│   ├── db.ts                    Prisma singleton
│   ├── api-auth.ts              Bearer verifier + rate limit
│   ├── actions/                 Server Actions per module
│   └── payments/                Provider abstraction (types, stripe, paypal, dispatcher)
├── lib/
│   ├── rbac.ts                  Permission matrix + can() / requirePermission()
│   ├── utils.ts                 cn, formatCurrency, formatDate, slugify, generateOrderNumber
│   ├── blob.ts                  Upload helpers (Vercel Blob + local fallback)
│   ├── email.ts                 Resend wrapper + console fallback
│   ├── csv.ts                   Papa parse/unparse
│   └── validations/             Shared Zod schemas
├── config/
│   ├── site.ts                  Site name + URL
│   ├── nav.ts                   Sidebar nav (per-permission gating)
│   └── theme-presets.ts         6 color presets
├── i18n/messages/en.json        next-intl seed
├── middleware.ts                Auth + route guards
└── types/
prisma/
├── schema.prisma                Single source of truth (24 models)
├── seed.ts                      Idempotent demo data
└── migrations/
public/
├── openapi.json                 OpenAPI 3.1
└── postman_collection.json      Ready-to-import
scripts/
├── create-test-key.ts           Dev API key generator (RW)
└── create-readonly-key.ts       Dev API key generator (read-only)
```

## Request lifecycles

### 1. Admin UI page load (e.g. `/products`)

```
Browser ─GET /products──▶ middleware.ts (auth check)
                              │
                              ▼ session valid
                          (dashboard)/layout.tsx ─ auth() → user object
                              │
                              ▼
                          products/page.tsx (Server Component)
                              │
                              ├─ db.product.findMany()
                              ▼
                          HTML streamed to browser
                              │
                              ▼ React hydrates
                          ProductsTable (Client Component) takes over interaction
```

No JSON API call. The Server Component reads DB directly via Prisma; the result is RSC-streamed.

### 2. Admin mutation (e.g. delete product)

```
Click "Delete" → confirm dialog → calls deleteProduct(id) (Server Action)
                                      │
                                      ▼
                                  "use server" file boots on Vercel
                                      │
                                      ├─ auth() — get session
                                      ├─ requirePermission(role, "products:delete") — 403 if missing
                                      ├─ db.product.delete()
                                      ├─ deleteFile() for each image (Vercel Blob)
                                      ├─ logAudit() — write AuditLog row
                                      └─ revalidatePath("/products") — cache bust
                                      │
                                      ▼
                                  Result returned to client → toast + router.refresh()
```

### 3. Public API request (e.g. storefront fetching products)

```
Storefront ─GET /api/public/v1/products─▶ Bearer auth (api-auth.ts)
            Authorization: Bearer …            │
                                               ├─ Extract prefix (first 12 chars)
                                               ├─ db.apiKey.findMany({ where: { prefix } })
                                               ├─ bcrypt.compare against candidates
                                               ├─ Check expiry, scope, rate limit
                                               │
                                               ▼ context returned
                                           Route handler runs DB query
                                               │
                                               ▼
                                           JSON + X-RateLimit-* headers
```

### 4. Stripe webhook

```
Stripe ─POST /api/webhooks/stripe─▶ stripeProvider.parseWebhook(body, signature)
        Stripe-Signature: …            │
                                       ├─ verify HMAC against STRIPE_WEBHOOK_SECRET
                                       ├─ map raw event → canonical PaymentEvent
                                       │
                                       ▼
                                   dispatcher.dispatchPaymentEvent(event)
                                       │
                                       ├─ Check AuditLog for providerEventId (idempotency)
                                       ├─ Write AuditLog
                                       ├─ Update Order.paymentStatus
                                       ├─ For refunds: create Refund row
                                       ├─ Cascade Order.status if fully refunded
                                       │
                                       ▼
                                   Response { received: true, applied: true|false }
```

## Design rules

1. **Money in cents** end-to-end. UI converts on display. No `Float`/`Number` for money in DB or wire.
2. **Server Actions for internal mutations.** Saves an entire API layer — no controllers, no serializers. RPC-by-import.
3. **Server Components for reads.** No client-side data fetching unless user-driven (search-as-you-type, pagination beyond URL).
4. **Public REST API for external consumers.** `/api/public/v1/*` is versioned and stable.
5. **Audit log on every mutation that matters.** `logAudit(userId, action, entity, entityId, diff)`.
6. **Idempotent webhooks.** Provider event ID is the dedup key.
7. **Atomic transactions** anywhere multiple rows must commit together (`db.$transaction`).
8. **Provider-agnostic payments.** `PaymentProvider` interface; never reference Stripe types in order code.
9. **`productSnapshot` in OrderItem.** Frozen at order time so historical orders survive product renames/deletes.
10. **Slug uniqueness auto-resolved.** `ensureUniqueSlug()` returns `slug-2`, `slug-3`, etc.
