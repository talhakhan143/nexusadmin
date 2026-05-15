# Changelog

All notable changes to NexusAdmin documented here. Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] — 2026-05-15

### Initial release — 9 phases shipped

#### Phase 1 — Foundation
- Next.js 16 App Router scaffold, TypeScript strict, Tailwind v4, shadcn/ui (new-york)
- Full Prisma schema (24 models)
- NextAuth v5 with Credentials + Google OAuth + JWT sessions
- RBAC (`SUPER_ADMIN` / `ADMIN` / `MANAGER` / `VIEWER`)
- Theme system: light/dark + 6 primary-color presets
- Dashboard shell (collapsible sidebar + topbar with search/notifications/theme toggle/color picker/user menu)
- Auth pages (login/register/forgot/reset) with Server Actions
- Reusable `<DataTable>` (TanStack Table v8)

#### Phase 2 — Products
- 6-tab product editor (General / Pricing / Variants / Media / Organization / SEO)
- Cartesian-product variant matrix builder
- Drag-drop multi-image upload (Vercel Blob + local fallback)
- Nested category tree CRUD with cycle protection
- Tags with on-the-fly creation
- CSV import (with dry-run) + export
- Status workflow + bulk actions + delete confirm

#### Phase 3 — Orders
- Server-side filterable list (status × paymentStatus × date × search)
- 2-column detail view with timeline, addresses, refunds, status updater
- Forward-only status workflow guard
- Tracking number editor
- Refund dialog with refundable cap
- Print-styled invoice page (browser → PDF)
- Demo order seed action

#### Phase 4 — Customers
- Segment chips (All / New / Repeat / VIP / Marketing opt-in)
- LTV-based VIP auto-detection
- Profile page with stat cards + order history + notes
- Address book CRUD with default-address logic

#### Phase 5 — Promotions
- Coupon CRUD (PERCENTAGE / FIXED / FREE_SHIPPING)
- Min purchase, max discount cap, usage + per-customer limits
- Scheduled start/expiry, scope (ALL / PRODUCTS / CATEGORIES)
- Cart-side coupon validator
- Flash sales with time windows + product targeting
- Auto status badges (Inactive / Expired / Exhausted / Live now / Upcoming / Ended)

#### Phase 6 — Analytics
- 6 KPI cards (Gross / Net / Refunded / Paid orders / AOV / New customers + conversion)
- Revenue+orders dual-axis chart, status donut, top products bar, customer growth chart
- 7d/30d/90d/365d preset chips + custom date inputs
- CSV export

#### Phase 7 — Payments
- Provider-agnostic `PaymentProvider` interface (Stripe wired, PayPal stub)
- Idempotent webhook dispatcher
- Webhook event log
- Reconciliation action
- Dev-only webhook simulator dropdown

#### Phase 8 — Settings
- 6 tabs: Store / Team / API keys / Email / Theme / Audit log
- Reveal-once password for new team members
- API keys hashed at rest with `nx_live_` prefix display
- Theme picker with "Make default"
- Audit log viewer with expandable JSON payloads

#### Phase 9 — Public Storefront API
- Bearer auth via API key (prefix-indexed bcrypt compare)
- Per-route scope checking
- In-memory rate limit (120/min/key) with `X-RateLimit-*` headers
- `GET /products` / `/products/:slug` / `/categories`
- `POST /checkout` (full cart pipeline with coupon math + stock decrement + customer upsert)
- `GET /orders/:orderNumber?email=…` (email-gated tracking)
- OpenAPI 3.1 spec + Postman v2.1 collection

#### Phase 10 — Polish & Docs
- Loading skeletons on every route
- Module-scoped error boundaries
- Comprehensive README, CONTRIBUTING.md, DEPLOYMENT.md, CHANGELOG.md, LICENSE
- Vercel deploy config

### Tech inventory

- 142+ source files
- 24 Prisma models
- ~15 Server Action files
- ~30 reusable UI components
- 5 chart types
- 8 module pages + 5 sub-routes
- 5 public API endpoints
