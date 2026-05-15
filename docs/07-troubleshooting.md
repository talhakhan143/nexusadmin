# 07 — Troubleshooting

Common issues + fixes.

## Build / dev

### "Module not found: @prisma/client"
Run `pnpm db:generate`. The Prisma client is generated, not committed.

### "Environment variable not found: DATABASE_URL"
Prisma reads `.env`, not `.env.local`. Either:
- Create a `.env` file with `DATABASE_URL=…` (gitignored)
- Or pass inline: `DATABASE_URL="…" pnpm db:migrate`

### Stale Prisma client after schema change
```bash
rm -rf node_modules/.prisma node_modules/@prisma/client
pnpm db:generate
```

### Hot reload broken / stale data
- Hard refresh the browser (cmd+shift+R)
- Delete `.next/` and restart dev: `rm -rf .next && pnpm dev`
- Check that you called `revalidatePath()` in your Server Action

### TypeScript error on Prisma type
After `db:migrate`, the generated client picks up new fields. Sometimes IDE caches the old types.
- VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

---

## Auth

### "Sign-in failed" but credentials are correct
Check the dev server console. Common causes:
- `AUTH_SECRET` missing
- `AUTH_URL` doesn't match the actual origin
- For Google OAuth: `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` missing or callback URL mismatch in Google Console

### Logged out unexpectedly
JWT tokens expire after 30 days. Re-sign in.

### Direct URL to /settings redirects to /
This is correct for non-`settings:manage` roles. Sign in as ADMIN or SUPER_ADMIN.

### Reset link "Invalid or expired"
- Token is single-use — clicked already
- Token > 1 hour old — request a new one
- Token doesn't exist — typo in URL

---

## Database

### SQLite locked errors
SQLite serializes writes. If you see `SQLITE_BUSY`, you have concurrent writers. For dev that's rare; for production, **use Postgres**.

### Migration fails: "drift detected"
You changed the schema in a way that conflicts with the prod state. Either:
- Reset dev DB: `pnpm prisma migrate reset` (DESTRUCTIVE)
- Manually align the migration with `prisma migrate resolve`

### "Json type not supported on SQLite"
You're trying to use Prisma's `Json` type on SQLite. Convert to `String` and JSON.stringify/parse manually, OR switch to Postgres.

### Foreign key constraint failed
Usually means you tried to delete a row that's referenced elsewhere with `onDelete: Restrict`. Check the relation in `schema.prisma` — change to `Cascade` or `SetNull` if appropriate.

---

## Uploads

### "BLOB_READ_WRITE_TOKEN missing" but uploads still work
The local fallback (`src/lib/blob.ts`) writes to `/public/uploads/` when the token is absent. Files persist as long as you don't `git clean` or redeploy. For production, **always set the BLOB token**.

### Image not displaying after upload
- Check the URL in the network tab
- For local-fallback uploads, the URL starts with `/uploads/` (relative)
- Add the upload domain to `next.config.ts` `images.remotePatterns` if using Vercel Blob:
  ```ts
  { protocol: "https", hostname: "*.public.blob.vercel-storage.com" }
  ```

### Upload returns 413
Default body size limit is 10MB (set in `next.config.ts` `serverActions.bodySizeLimit`). The `/api/upload` route also has its own 8MB cap.

---

## Webhooks

### Webhook returns 400
- Signature verification failed. Check that `STRIPE_WEBHOOK_SECRET` matches the endpoint's secret in Stripe Dashboard.
- For testing: use Stripe CLI `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and use its output secret.

### Webhook applied: false
Check the response body. Possible reasons:
- `"reason": "duplicate"` — already processed
- `"reason": "no orderId in metadata"` — Stripe Checkout Session was created without `metadata.orderId` (admin's checkout always sets it)
- `"reason": "order not found"` — the order was deleted, or the metadata orderId is stale

### Want to replay a webhook
Stripe Dashboard → Developers → Webhooks → click the event → "Resend".

For local testing without Stripe: use the dev simulator at Settings → Payments → Simulate dropdown per row.

---

## Public API

### 401 every request
- Check `Authorization: Bearer …` header is present (case-insensitive but `Bearer` is required)
- Check the key prefix matches a row in DB: `SELECT prefix FROM ApiKey;`
- If the key was revoked, regenerate

### 403 with valid key
Your key doesn't have the required scope. Check the key's scopes in Settings → API keys, or:
```sql
SELECT name, scopes FROM ApiKey WHERE prefix = 'nx_live_xxxx';
```

### 429 too quickly
- Default rate limit: 120 req/min/key
- Buckets are in-memory, so each Vercel function instance has its own bucket. Multi-region deploys may give you `120 * N` effective limit.
- For higher limits: edit `RATE_LIMIT_PER_MINUTE` in `src/server/api-auth.ts`, or replace with Redis (Upstash recommended)

### Checkout returns "Insufficient stock"
- The variant's stock is below the requested quantity
- Stock decrements happen on every successful checkout
- Increase stock via the admin: Products → click row → Variants tab → bump Stock

### Order tracking returns 404
- Order number doesn't exist, OR
- Email parameter doesn't match the customer's email (case-insensitive comparison)
- This is intentional — prevents order-number scanning attacks

---

## Theming

### Theme picker has no visible effect
- Hard reload (cmd+shift+R) — the CSS vars apply but cached pages may still render old colors
- Check localStorage: `localStorage.getItem("nexusadmin.theme.preset")` should be one of: `slate`, `blue`, `violet`, `rose`, `green`, `orange`
- If stuck: `localStorage.removeItem("nexusadmin.theme.preset"); location.reload();`

### Custom logo not showing
- Settings → Store → Logo URL must be a publicly-accessible HTTPS URL
- Add the host to `next.config.ts` `images.remotePatterns` if using `<Image>` component

---

## Performance

### Pages slow on first load
- Cold start. Vercel Fluid Compute warms after first request.
- Heavy modules (Analytics with many charts): consider lazy-loading individual chart components.

### Public API slow
- bcrypt.compare on every request takes ~100ms
- For high-traffic, cache the API key validation result for the request lifetime (already done — checks `lastUsedAt` is updated async)
- For multi-region: replace bcrypt with HMAC-SHA256 of the key prefix index lookup

---

## Help

If you hit something not listed here:
1. Check the dev server console — most issues print a clear error
2. Check the browser DevTools console + network tab
3. Check `src/components/modules/route-error.tsx` is wired to your error tracking (Sentry recommended)
4. Open an issue with reproduction steps + logs
