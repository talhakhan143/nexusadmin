# 06 — Extending modules

Add a new feature module without touching existing code. Recipe is identical for Brands / Reviews / Wishlist / Vendors / etc.

## Example: adding a "Brands" module

### Step 1 — Schema

Edit `prisma/schema.prisma`:

```prisma
model Brand {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  logo        String?
  description String?
  website     String?
  isActive    Boolean   @default(true)
  products    Product[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([slug])
  @@index([isActive])
}

// Add brandId to Product
model Product {
  // …existing fields…
  brandId String?
  brand   Brand? @relation(fields: [brandId], references: [id], onDelete: SetNull)
}
```

Then:

```bash
pnpm db:migrate    # name it: add_brand
```

### Step 2 — Validation

Create `src/lib/validations/brand.ts`:

```ts
import { z } from "zod";

export const brandSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  logo: z.string().url().optional().nullable().or(z.literal("")),
  description: z.string().max(1000).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true),
});
export type BrandInput = z.infer<typeof brandSchema>;
```

### Step 3 — Permission

Add to `src/lib/rbac.ts`:

```ts
export type Permission =
  | "…existing…"
  | "brands:read"
  | "brands:write"
  | "brands:delete";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [/* … */, "brands:read", "brands:write", "brands:delete"],
  ADMIN:       [/* … */, "brands:read", "brands:write", "brands:delete"],
  MANAGER:     [/* … */, "brands:read", "brands:write"],
  VIEWER:      [/* … */, "brands:read"],
};
```

### Step 4 — Server Action

Create `src/server/actions/brands.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { requirePermission } from "@/lib/rbac";
import { brandSchema, type BrandInput } from "@/lib/validations/brand";
import { slugify } from "@/lib/utils";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

async function uniqueSlug(name: string, slug?: string, excludeId?: string): Promise<string> {
  let base = slug || slugify(name) || "brand";
  let candidate = base;
  let i = 2;
  while (await db.brand.findFirst({ where: { slug: candidate, ...(excludeId && { NOT: { id: excludeId } }) }, select: { id: true } })) {
    candidate = `${base}-${i++}`;
  }
  return candidate;
}

export async function createBrand(input: BrandInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  try { requirePermission(session?.user?.role, "brands:write"); }
  catch (e: any) { return { ok: false, error: e.message }; }

  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const slug = await uniqueSlug(parsed.data.name, parsed.data.slug);
  const b = await db.brand.create({ data: { ...parsed.data, slug, logo: parsed.data.logo || null, website: parsed.data.website || null } });
  revalidatePath("/brands");
  return { ok: true, data: { id: b.id } };
}

export async function updateBrand(id: string, input: BrandInput): Promise<ActionResult> { /* same shape */ }
export async function deleteBrand(id: string): Promise<ActionResult> {
  const session = await auth();
  try { requirePermission(session?.user?.role, "brands:delete"); }
  catch (e: any) { return { ok: false, error: e.message }; }
  await db.brand.delete({ where: { id } });
  revalidatePath("/brands");
  return { ok: true };
}
```

### Step 5 — Page

Create `src/app/(dashboard)/brands/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/modules/page-header";
import { BrandsTable } from "./brands-table";

export const metadata = { title: "Brands" };

export default async function BrandsPage() {
  const session = await auth();
  const canWrite = can(session?.user?.role, "brands:write");
  const brands = await db.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  const rows = brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    products: b._count.products,
    isActive: b.isActive,
  }));
  return (
    <>
      <PageHeader title="Brands" description={`${brands.length} brand(s).`}>
        {canWrite && (
          <Button asChild>
            <Link href="/brands/new"><Plus className="mr-2 h-4 w-4" /> New brand</Link>
          </Button>
        )}
      </PageHeader>
      <BrandsTable data={rows} canWrite={canWrite} />
    </>
  );
}
```

Plus `brands-table.tsx` (client component using `<DataTable>` — copy the shape from `products-table.tsx` and rename).

### Step 6 — Loading + error fallbacks

Two 4-line files:

```tsx
// src/app/(dashboard)/brands/loading.tsx
import { ListSkeleton } from "@/components/modules/list-skeleton";
export default function Loading() { return <ListSkeleton rows={6} />; }
```

```tsx
// src/app/(dashboard)/brands/error.tsx
"use client";
import { RouteError } from "@/components/modules/route-error";
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError module="Brands" {...props} />;
}
```

### Step 7 — Sidebar nav

Edit `src/config/nav.ts`:

```ts
import { Award /* …existing… */ } from "lucide-react";

// In the "Catalog" group:
{ title: "Brands", href: "/brands", icon: Award, permission: "brands:read" },
```

### Step 8 — (optional) Public API

Create `src/app/api/public/v1/brands/route.ts`:

```ts
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { verifyApiKey, withRateHeaders } from "@/server/api-auth";

export async function GET(req: Request) {
  const ctx = await verifyApiKey(req, "brands:read");
  if (ctx instanceof Response) return ctx;
  const items = await db.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  return withRateHeaders(NextResponse.json({ items }), ctx);
}
```

Update `public/openapi.json` with the new path.

### That's it

You added a full module — schema, validation, RBAC, server actions, list page, loading/error states, sidebar nav, and public API — without modifying any existing module. Same pattern works for Reviews, Wishlist, Vendors, Subscriptions, etc.
