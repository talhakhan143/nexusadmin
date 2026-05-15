# Deployment Guide

NexusAdmin deploys cleanly to Vercel (recommended) or any Node 20+ host that runs Next.js.

---

## Vercel (recommended)

### 1. Create a Postgres database

| Option | Notes |
|---|---|
| **Supabase** | Free tier, built-in storage. Use the **pooler** URL for `DATABASE_URL` (`?pgbouncer=true`) and the **direct** URL for `DIRECT_URL` (Prisma migrate needs direct). |
| **Neon** | Vercel-native, branching, autoscale. Single URL works for both. |
| **Railway / PlanetScale (Postgres) / Render** | Standard `postgresql://` URL. |

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin git@github.com:<you>/<repo>.git
git push -u origin main
```

### 3. Import to Vercel

- New Project → import the repo
- Framework: auto-detected as Next.js
- Build command: **override** to `prisma migrate deploy && next build`
- Install command: leave default

### 4. Environment variables

Set in Project Settings → Environment Variables (Production + Preview + Development as needed):

| Var | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Pooler URL on Supabase, direct on Neon |
| `DIRECT_URL` | ✅ if Supabase | Non-pooled Postgres URL — Prisma needs this for migrations |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `AUTH_URL` | ✅ | `https://<your-domain>` |
| `AUTH_TRUST_HOST` | ✅ | `true` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | optional | for Google OAuth |
| `BLOB_READ_WRITE_TOKEN` | optional | Vercel → Storage → Blob → Create Store |
| `RESEND_API_KEY` | optional | for transactional email |
| `EMAIL_FROM` | optional | `"Store <noreply@yourdomain.com>"` |
| `STRIPE_SECRET_KEY` | optional | `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | optional | `whsec_…` (per-endpoint) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | optional | client-side Stripe |
| `NEXT_PUBLIC_APP_URL` | recommended | `https://<your-domain>` |
| `NEXT_PUBLIC_APP_NAME` | optional | overrides default `NexusAdmin` |

### 5. First deploy — seed the database

After the first successful deploy, seed the prod DB once from your local machine:

```bash
DATABASE_URL="<prod url>" pnpm db:seed
```

Then **immediately** rotate the seeded `admin@nexusadmin.dev` password by signing in and resetting via Settings → Team (or via SQL).

### 6. Stripe webhook

Stripe Dashboard → Developers → Webhooks → Add endpoint:

- URL: `https://<your-domain>/api/webhooks/stripe`
- Events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
- Copy the signing secret → `STRIPE_WEBHOOK_SECRET` env var

### 7. Custom domain

Vercel → Settings → Domains → add your domain.

After adding, update env: `AUTH_URL=https://<your-domain>` and `NEXT_PUBLIC_APP_URL=https://<your-domain>`. Redeploy.

---

## Self-host (Docker)

A minimal Dockerfile is not shipped (Vercel preferred), but the app runs anywhere Node 20+ runs Next.js. Pattern:

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

Run with env vars from your secrets manager. Use `prisma migrate deploy` as part of release pipeline.

---

## Post-deploy checklist

- [ ] Demo seed users password changed (or seeded users deleted)
- [ ] At least one SUPER_ADMIN exists with a strong password
- [ ] AUTH_URL matches the deployed origin
- [ ] HTTPS enforced (Vercel does this automatically)
- [ ] Stripe webhook signing secret matches the endpoint
- [ ] Vercel Blob (or Cloudinary / S3 / Supabase Storage) wired if uploads are used
- [ ] First test order placed end-to-end via the public API or admin UI
- [ ] Backups configured at the database provider
- [ ] Monitoring (Vercel Analytics or Sentry) wired
- [ ] Error reporting in `src/components/modules/route-error.tsx` swapped from `console.error` to your service

---

## Performance notes

- **Fluid Compute** is the default on Vercel — function instances are reused across concurrent requests, dramatically lowering cold starts vs traditional serverless.
- The Prisma client is singleton-cached across hot reloads (`src/server/db.ts`).
- All heavy data fetches use Server Components — no client waterfall.
- Public storefront API responses set `revalidate = 60` on `/products` and `revalidate = 300` on `/categories` for ISR.
- Charts are client-only (Recharts) and lazily mount when their tab is visited.

---

## Scaling checklist

- Replace in-memory rate limit (`src/server/api-auth.ts`) with Redis (Upstash recommended)
- Replace `console.log` email fallback with real Resend / SES
- Move audit log to a separate analytics DB once it exceeds ~10M rows
- Add a CDN in front of `/api/public/v1/products` if traffic spikes
- Consider read replicas for the storefront API once you exceed ~5k req/s
