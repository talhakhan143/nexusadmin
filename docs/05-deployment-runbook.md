# 05 — Deployment runbook

> See also [`/DEPLOYMENT.md`](../DEPLOYMENT.md) at repo root for the quickstart. This doc covers operational concerns.

## Pre-flight checklist

Before first deploy:

- [ ] Postgres database provisioned (Supabase / Neon / Railway / managed Postgres)
- [ ] `DATABASE_URL` + `DIRECT_URL` (if Supabase) ready
- [ ] `AUTH_SECRET` generated: `openssl rand -base64 32`
- [ ] Domain decided, DNS pointed at Vercel (or your host)
- [ ] Email provider (Resend) account created if you want transactional emails
- [ ] Vercel Blob store created if you want managed file storage
- [ ] Stripe account in test mode + webhook signing secret ready (production mode after smoke test)

## Initial deploy

```bash
# 1. Push to GitHub
git init
git add -A
git commit -m "Initial NexusAdmin deploy"
gh repo create my-store-admin --public --source=. --push
# (or use vercel CLI — vercel link, vercel deploy)

# 2. Vercel: import project from GitHub
# 3. In Project Settings → Environment Variables, paste all from .env.example
# 4. Override Build Command:
#    prisma migrate deploy && next build
# 5. Deploy
```

## First-run seed

After first successful deploy:

```bash
# From your local machine, pointing at prod DB:
DATABASE_URL="<prod url>" pnpm db:seed

# Then IMMEDIATELY rotate the seed admin password.
# Sign in at https://<domain>/login with admin@nexusadmin.dev / admin123
# Then either:
#   a) Delete the demo users via SQL once you've created your own SUPER_ADMIN
#   b) Use Settings → Team to change roles + reset passwords
```

## Stripe webhook setup

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://<your-domain>/api/webhooks/stripe`
3. Events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy "Signing secret" → set as `STRIPE_WEBHOOK_SECRET` env var on Vercel
5. Test: Stripe Dashboard → Send test event → `payment_intent.succeeded`
6. Verify: Settings → Webhook log should show the event

## Custom domain

```bash
# In Vercel: Settings → Domains → Add
# Then update env vars:
AUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Redeploy
```

## Rolling back

```bash
# Vercel UI: Deployments → click previous deployment → Promote to Production

# Or CLI:
vercel rollback https://<deployment-url>
```

## Database migrations in production

Always reversible. Workflow:

```bash
# Local dev:
pnpm db:migrate         # Creates migration file in prisma/migrations/

# Commit it, push, deploy.
# Vercel build command runs `prisma migrate deploy` automatically.
```

If a migration breaks production:
1. Don't try to roll it back via Prisma — that's painful
2. Instead: write a new "fix-up" migration that reverses or compensates
3. Push, deploy

## Backups

- **Supabase / Neon**: automatic daily backups, point-in-time restore
- **Self-hosted Postgres**: set up `pg_dump` cron via systemd or k8s CronJob
- **Test restore quarterly**: download a backup, restore to a fresh DB, run `pnpm dev` to confirm app starts

## Monitoring

Recommended:
- **Vercel Analytics** for page-level performance
- **Vercel Logs** for function output (already wired)
- **Sentry** for error tracking — wire into `src/components/modules/route-error.tsx` and `src/app/error.tsx`
- **Uptime** monitor (BetterStack / UptimeRobot) on `https://<domain>/login` (returns 200 if app boots)
- **Database** monitoring via Supabase/Neon dashboard

## Common ops

### Reset an API key
Settings → API keys → Revoke → New key. Copy + redistribute. Old consumers get 401.

### Deactivate a team member
Settings → Team → click power icon. Their session stays valid until expiry; consider logging them out manually if urgent: clear NextAuth session cookies via DB.

### Change tax rate
Settings → Store → Tax → save. Applies to **new** orders only. Historical orders unchanged.

### Reconcile payment drift
Run from a server console:
```ts
// In Next.js Route Handler or a one-off script
import { reconcilePayments } from "@/server/actions/payments";
await reconcilePayments(); // recomputes paymentStatus for all orders from refund aggregates
```

### Recompute customer LTV
```ts
import { recomputeCustomerAggregates } from "@/server/actions/customers";
await recomputeCustomerAggregates(); // recomputes totalSpent + ordersCount
```

## Scaling notes

- **Rate limit** is in-memory (`src/server/api-auth.ts`). On Vercel multi-region, replace with Upstash Redis once you exceed ~50 RPS sustained.
- **Audit log** can grow unbounded. Add a cron to delete entries older than 90 days, or move to a separate `analytics_events` DB once it crosses ~10M rows.
- **Public API** sets `revalidate = 60` on products and `revalidate = 300` on categories — products served from cache hit Vercel Edge, not the function. Trade-off: 60s stale on price changes.
- **Stripe webhook** function timeout set to 60s in `vercel.json`. Increase if your dispatcher does heavy work.
