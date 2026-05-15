# NexusAdmin — Documentation

Complete reference for understanding, extending, and integrating with the NexusAdmin e-commerce backend.

| Doc | When to read |
|---|---|
| [00 — Architecture](./00-architecture.md) | First read. Understand the layout, request flow, data model overview, and design decisions. |
| [01 — Database schema](./01-database-schema.md) | Reference for every Prisma model, every relation, every index. |
| [02 — API reference](./02-api-reference.md) | Internal Server Actions + public REST API. Bearer auth, scopes, rate limits. |
| [03 — Frontend integration guide](./03-frontend-integration-guide.md) | **Building a storefront/customer-facing site that consumes this admin?** Start here. End-to-end product list → cart → checkout → order tracking flow with code samples. |
| [04 — RBAC + auth](./04-rbac-and-auth.md) | How permissions work. NextAuth flows. Adding a new role. Securing a new action. |
| [05 — Deployment runbook](./05-deployment-runbook.md) | Vercel / self-host. Env vars. Postgres migration. Stripe webhook setup. |
| [06 — Extending modules](./06-extending-modules.md) | Recipe for adding a new feature module (Brands / Reviews / Wishlist / etc). |
| [07 — Troubleshooting](./07-troubleshooting.md) | Common errors + fixes. Stale Prisma client, BLOB token missing, webhook 400, etc. |

---

## TL;DR

NexusAdmin is a single Next.js 16 app:
- **Admin UI** at `/` (sidebar + 8 modules)
- **Auth API** at `/api/auth/*` (NextAuth v5)
- **Webhook receivers** at `/api/webhooks/*` (Stripe + future)
- **Public storefront API** at `/api/public/v1/*` (Bearer-token, scope-checked, rate-limited)

Storefront sites consume `/api/public/v1/*` — no direct DB access, no shared auth. The admin owns all writes; storefront does reads + checkout (which is itself a guarded write through the API).

```
┌─────────────────┐         ┌──────────────────────┐         ┌──────────────┐
│  Admin Browser  │  ◀──▶   │  NexusAdmin (this)   │  ◀──▶   │  Postgres    │
└─────────────────┘  HTTPS  │  Next.js 16          │  TCP    └──────────────┘
                            │  • UI (RSC + RHF)    │
┌─────────────────┐  HTTPS  │  • Server Actions    │
│  Storefront(s)  │  ◀──▶   │  • Public REST API   │
└─────────────────┘  Bearer │  • Webhook receivers │
                            │                      │
┌─────────────────┐  HTTPS  │                      │
│  Stripe         │  ───▶   └──────────────────────┘
└─────────────────┘
```

---

## Quick links

- Live demo seed: `admin@nexusadmin.dev / admin123` (Super Admin)
- OpenAPI spec: [`/public/openapi.json`](../public/openapi.json)
- Postman collection: [`/public/postman_collection.json`](../public/postman_collection.json)
- Production deploy guide: [`/DEPLOYMENT.md`](../DEPLOYMENT.md)
- Changelog: [`/CHANGELOG.md`](../CHANGELOG.md)
