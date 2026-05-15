# 04 — RBAC + auth

## Roles

Defined in `prisma/schema.prisma` as `enum UserRole`:

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Full access. Can manage users, API keys, all settings, all data. |
| `ADMIN` | Almost everything. Cannot manage users or API keys. |
| `MANAGER` | Day-to-day operations. Can create/update products, orders, customers, promotions. Cannot delete or refund. |
| `VIEWER` | Read-only across all modules. Cannot mutate. |

## Permission matrix

Defined in [`/src/lib/rbac.ts`](../src/lib/rbac.ts).

| Permission | SUPER_ADMIN | ADMIN | MANAGER | VIEWER |
|---|:-:|:-:|:-:|:-:|
| `users:manage` | ✅ | ❌ | ❌ | ❌ |
| `store:manage` | ✅ | ✅ | ❌ | ❌ |
| `products:read` | ✅ | ✅ | ✅ | ✅ |
| `products:write` | ✅ | ✅ | ✅ | ❌ |
| `products:delete` | ✅ | ✅ | ❌ | ❌ |
| `orders:read` | ✅ | ✅ | ✅ | ✅ |
| `orders:write` | ✅ | ✅ | ✅ | ❌ |
| `orders:refund` | ✅ | ✅ | ❌ | ❌ |
| `customers:read` | ✅ | ✅ | ✅ | ✅ |
| `customers:write` | ✅ | ✅ | ✅ | ❌ |
| `promotions:read` | ✅ | ✅ | ✅ | ✅ |
| `promotions:write` | ✅ | ✅ | ✅ | ❌ |
| `analytics:read` | ✅ | ✅ | ✅ | ✅ |
| `settings:manage` | ✅ | ✅ | ❌ | ❌ |
| `apikeys:manage` | ✅ | ❌ | ❌ | ❌ |

## Three layers of enforcement

### 1. Middleware (route guard)

`src/middleware.ts` redirects unauthenticated users to `/login` for any protected route. It does NOT check fine-grained permissions — that happens deeper.

### 2. Server Component (page-level)

```ts
// e.g. src/app/(dashboard)/settings/page.tsx
const session = await auth();
if (!can(session?.user?.role, "settings:manage")) redirect("/");
```

This stops the page from rendering at all, doing a server-side redirect. The user never sees a 403.

### 3. Server Action (data-level)

Every mutation calls `requirePermission`:

```ts
"use server";
import { auth } from "@/server/auth";
import { requirePermission } from "@/lib/rbac";

export async function deleteProduct(id: string) {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "products:delete");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  // …actual mutation…
}
```

### 4. UI conditional render (UX layer)

```tsx
import { can } from "@/lib/rbac";
{can(session?.user?.role, "products:write") && <Button>+ New product</Button>}
```

This isn't security — it's UX. The Server Action layer is the actual gate. UI hiding just prevents users from clicking buttons that would bounce.

## NextAuth flows

### Sign-in (Credentials)

1. User submits `/login` form
2. NextAuth `authorize()` callback in `src/server/auth.ts`
3. Validates with Zod, looks up user by email, bcrypt-compares password
4. On success: updates `lastLoginAt`, returns user object
5. JWT issued, session cookie set
6. `jwt()` callback hydrates `role` into the token
7. `session()` callback exposes `role` on `session.user.role`

### Sign-in (Google OAuth)

Only available if `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` env vars set. The provider list is built dynamically.

After Google sign-in, the user is auto-created with `role: VIEWER`. Promote them via Settings → Team.

### Forgot password

1. POST `forgotPasswordAction({ email })`
2. If email exists: generate 32-byte hex token, write `PasswordResetToken` (1-hour expiry), send email
3. **Always return `{ ok: true }`** — prevents user enumeration
4. User clicks link → `/reset-password?token=…`
5. POST `resetPasswordAction({ token, password, confirmPassword })`
6. Validates token (exists, not used, not expired), bcrypts new password, marks token `usedAt`

### Sign out

NextAuth's `signOut()` clears the session cookie. Client-side `<UserMenu>` calls `signOut({ callbackUrl: "/login" })`.

## Adding a new permission

1. Add to `Permission` type in `src/lib/rbac.ts`:
   ```ts
   export type Permission = "…" | "brands:write";
   ```
2. Add to `ROLE_PERMISSIONS` for each role that should have it.
3. Use it: `requirePermission(role, "brands:write")` in your action, `can(role, "brands:write")` in your UI.

## Adding a new role

1. Edit `prisma/schema.prisma`:
   ```prisma
   enum UserRole {
     SUPER_ADMIN
     ADMIN
     MANAGER
     VIEWER
     EDITOR  // new
   }
   ```
2. `pnpm db:migrate` — name it something like `add_editor_role`
3. Add `EDITOR` to `ROLE_PERMISSIONS` in `src/lib/rbac.ts`
4. Add `EDITOR` to UI selects (TeamPanel, etc.)

## Audit log

Every mutation that matters writes an `AuditLog` row. Schema:
- `userId` — who did it (null for system/webhook events)
- `action` — `"product.create"`, `"product.delete"`, `"webhook.received"`, etc.
- `entity` — `"Product"`, `"Order"`, `"Webhook"`, etc.
- `entityId` — the affected row's ID
- `diff` — JSON string of before/after or relevant payload
- `createdAt`

Viewable in Settings → Audit log (last 50, sortable). Exportable via SQL or a future export action.

## Public API auth (separate)

The Bearer-token API has its own auth path — see [`02-api-reference.md`](./02-api-reference.md). API keys never grant admin UI access; they're scoped strictly to public endpoints. Sessions and API keys are independent.
