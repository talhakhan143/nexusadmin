# 03 — Frontend integration guide

**Building a customer-facing storefront that consumes this admin? Start here.**

This guide walks through the full storefront → admin flow with copy-pasteable code. No prior knowledge of NexusAdmin internals required.

---

## What you'll build

A storefront that:
1. Lists products from the admin's catalog
2. Shows product detail with variants
3. Maintains a cart (client-side)
4. Validates coupons in real time
5. Submits checkout → creates an order in the admin
6. Lets the customer track their order

---

## Step 0 — Get an API key

1. Sign in to NexusAdmin as SUPER_ADMIN
2. Settings → API keys → "New key"
3. Name: `Storefront prod`
4. Scopes: `products:read`, `categories:read`, `orders:read`, `orders:write`, `promotions:read`
5. Copy the plaintext (`nx_live_…`) — **shown only once**
6. Store in your storefront's `.env.local`:

```bash
NEXUSADMIN_API_URL=https://admin.yourstore.com/api/public/v1
NEXUSADMIN_API_KEY=nx_live_xxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Never** put the API key in client-side code. Always proxy through your storefront's own server (Next.js Route Handler, Express middleware, etc.) so the key never reaches the browser.

---

## Step 1 — A typed API client

Create a single source of truth for your storefront → admin calls.

```ts
// lib/nexus.ts
const BASE = process.env.NEXUSADMIN_API_URL!;
const KEY = process.env.NEXUSADMIN_API_KEY!;

async function call<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    // ISR: cache product/category responses for 60 seconds
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Nexus ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// Types — match the API responses
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number; // cents
  compareAtPrice: number | null;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  category: { name: string; slug: string } | null;
  images: { url: string; alt: string | null }[];
  variants: { id: string; name: string | null; price: number; stock: number }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  parentId: string | null;
  _count: { products: number };
}

export interface CheckoutPayload {
  customer: { email: string; name?: string; phone?: string; acceptsMarketing?: boolean };
  items: { variantId: string; quantity: number }[];
  shippingAddress: Address;
  billingAddress?: Address;
  couponCode?: string;
  shippingAmount?: number;
  notes?: string;
}

export interface Address {
  firstName?: string;
  lastName?: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  phone?: string;
}

export interface OrderResponse {
  orderNumber: string;
  id: string;
  status: string;
  paymentStatus: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  checkoutUrl: string | null;
}

// API methods
export const nexus = {
  listProducts: (opts?: { limit?: number; cursor?: string; category?: string }) => {
    const q = new URLSearchParams();
    if (opts?.limit) q.set("limit", String(opts.limit));
    if (opts?.cursor) q.set("cursor", opts.cursor);
    if (opts?.category) q.set("category", opts.category);
    return call<{ items: Product[]; nextCursor: string | null }>(
      `/products${q.toString() ? `?${q}` : ""}`
    );
  },

  getProduct: (slug: string) => call<Product>(`/products/${slug}`),

  listCategories: () => call<{ items: Category[] }>("/categories"),

  checkout: (payload: CheckoutPayload) =>
    call<OrderResponse>("/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
      cache: "no-store", // never cache mutations
    }),

  trackOrder: (orderNumber: string, email: string) =>
    call<TrackingResponse>(
      `/orders/${orderNumber}?email=${encodeURIComponent(email)}`,
      { cache: "no-store" }
    ),
};

export interface TrackingResponse {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  currency: string;
  total: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
  placedAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: { name: string; variant: string; sku: string; quantity: number; unitPrice: number; total: number }[];
  shippingAddress: Address;
  timeline: { status: string; at: string; note: string | null }[];
}
```

---

## Step 2 — Product list page

```tsx
// app/page.tsx (Next.js storefront)
import { nexus } from "@/lib/nexus";
import Link from "next/link";

export default async function HomePage() {
  const { items: products } = await nexus.listProducts({ limit: 20 });

  return (
    <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      {products.map((p) => (
        <Link key={p.id} href={`/products/${p.slug}`} className="group">
          {p.images[0] && (
            <img
              src={p.images[0].url}
              alt={p.images[0].alt ?? p.name}
              className="aspect-square w-full object-cover rounded-md"
            />
          )}
          <h3 className="mt-2 font-medium group-hover:underline">{p.name}</h3>
          <p className="text-sm text-gray-600">
            ${(p.basePrice / 100).toFixed(2)}
            {p.compareAtPrice && (
              <span className="ml-2 line-through text-gray-400">
                ${(p.compareAtPrice / 100).toFixed(2)}
              </span>
            )}
          </p>
        </Link>
      ))}
    </main>
  );
}
```

---

## Step 3 — Product detail with variant selector

```tsx
// app/products/[slug]/page.tsx
import { nexus } from "@/lib/nexus";
import { ProductPurchase } from "./ProductPurchase";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await nexus.getProduct(slug);

  return (
    <main className="grid lg:grid-cols-2 gap-8 p-6">
      <div className="space-y-2">
        {product.images.map((img) => (
          <img key={img.url} src={img.url} alt={img.alt ?? ""} className="w-full rounded-md" />
        ))}
      </div>
      <div>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="mt-2 text-gray-700">{product.description}</p>
        <ProductPurchase product={product} />
      </div>
    </main>
  );
}
```

```tsx
// app/products/[slug]/ProductPurchase.tsx
"use client";
import { useState } from "react";
import type { Product } from "@/lib/nexus";
import { useCart } from "@/lib/cart-store";

export function ProductPurchase({ product }: { product: Product }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const variant = product.variants.find((v) => v.id === variantId);
  const { addItem } = useCart();

  return (
    <div className="mt-6 space-y-4">
      {product.variants.length > 1 && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Variant</label>
          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="w-full rounded border p-2"
          >
            {product.variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.stock === 0}>
                {v.name ?? "Default"} — ${(v.price / 100).toFixed(2)}
                {v.stock === 0 && " (out of stock)"}
              </option>
            ))}
          </select>
        </div>
      )}
      <p className="text-2xl font-semibold">
        ${((variant?.price ?? product.basePrice) / 100).toFixed(2)}
      </p>
      <button
        onClick={() => variant && addItem({ variantId: variant.id, name: product.name, variantName: variant.name, unitPrice: variant.price, image: product.images[0]?.url })}
        disabled={!variant || variant.stock === 0}
        className="w-full bg-black text-white py-3 rounded-md disabled:opacity-50"
      >
        Add to cart
      </button>
    </div>
  );
}
```

---

## Step 4 — Cart store (Zustand example)

```ts
// lib/cart-store.ts
"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  variantId: string;
  name: string;
  variantName: string | null;
  unitPrice: number; // cents
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((s) => {
        const existing = s.items.find((i) => i.variantId === item.variantId);
        if (existing) {
          return { items: s.items.map((i) => i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i) };
        }
        return { items: [...s.items, { ...item, quantity: 1 }] };
      }),
      removeItem: (variantId) => set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),
      updateQuantity: (variantId, qty) => set((s) => ({
        items: qty <= 0
          ? s.items.filter((i) => i.variantId !== variantId)
          : s.items.map((i) => i.variantId === variantId ? { ...i, quantity: qty } : i),
      })),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    }),
    { name: "cart" }
  )
);
```

---

## Step 5 — Checkout

Proxy through your storefront's API route so the API key stays server-side.

```ts
// app/api/checkout/route.ts (storefront)
import { NextResponse } from "next/server";
import { nexus, type CheckoutPayload } from "@/lib/nexus";

export async function POST(req: Request) {
  const body = (await req.json()) as CheckoutPayload;
  try {
    const order = await nexus.checkout(body);
    return NextResponse.json(order);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
```

```tsx
// app/checkout/CheckoutForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";

export function CheckoutForm() {
  const router = useRouter();
  const cart = useCart();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      customer: {
        email: fd.get("email") as string,
        name: fd.get("name") as string,
        acceptsMarketing: fd.get("marketing") === "on",
      },
      items: cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      shippingAddress: {
        firstName: fd.get("firstName") as string,
        lastName: fd.get("lastName") as string,
        line1: fd.get("line1") as string,
        city: fd.get("city") as string,
        state: fd.get("state") as string,
        country: fd.get("country") as string,
        postalCode: fd.get("postalCode") as string,
      },
      couponCode: (fd.get("coupon") as string) || undefined,
      shippingAmount: 500, // $5 flat
    };

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("Checkout failed");
      setSubmitting(false);
      return;
    }
    const order = await res.json();
    cart.clear();
    router.push(`/orders/${order.orderNumber}?email=${encodeURIComponent(payload.customer.email)}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-md">
      {/* …form fields… */}
      <button type="submit" disabled={submitting} className="w-full bg-black text-white py-3 rounded">
        {submitting ? "Placing order…" : "Place order"}
      </button>
    </form>
  );
}
```

---

## Step 6 — Order tracking page

```tsx
// app/orders/[orderNumber]/page.tsx
import { nexus } from "@/lib/nexus";

export default async function OrderTracking({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { orderNumber } = await params;
  const { email } = await searchParams;
  if (!email) return <p>Email required.</p>;

  try {
    const order = await nexus.trackOrder(orderNumber, email);
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
        <p>Status: {order.status}</p>
        <p>Total: ${(order.total / 100).toFixed(2)}</p>
        {order.trackingNumber && (
          <p>Tracking: {order.trackingNumber}</p>
        )}
        <ul className="mt-6 space-y-3">
          {order.timeline.map((t, i) => (
            <li key={i}>
              <strong>{t.status}</strong> — {new Date(t.at).toLocaleString()}
              {t.note && <p className="text-sm text-gray-600">{t.note}</p>}
            </li>
          ))}
        </ul>
      </main>
    );
  } catch {
    return <p>Order not found.</p>;
  }
}
```

---

## Banners — content slots controlled by the admin

The admin owns banner **content + scheduling**; your storefront owns **layout + styling**. The contract between the two is the `placement` key.

### Available placements

| Key | Typical use |
|---|---|
| `HOMEPAGE_HERO` | Top-of-homepage carousel slot |
| `HOMEPAGE_SECONDARY` | Mid-homepage strip / featured row |
| `HOMEPAGE_FOOTER` | Bottom-of-homepage strip |
| `CATEGORY_TOP` | Banner above category listing |
| `PRODUCT_DETAIL_SIDE` | Sidebar on product detail page |
| `CART_SIDEBAR` | Upsell strip in cart |
| `CHECKOUT_TOP` | Notice above checkout form |
| `POPUP` | Modal banner — storefront decides trigger |
| `CUSTOM` | Free-form slot, identified by `customKey` |

### Add to the typed client

```ts
// lib/nexus.ts (add to the existing file)

export type BannerPlacement =
  | "HOMEPAGE_HERO" | "HOMEPAGE_SECONDARY" | "HOMEPAGE_FOOTER"
  | "CATEGORY_TOP" | "PRODUCT_DETAIL_SIDE"
  | "CART_SIDEBAR" | "CHECKOUT_TOP" | "POPUP" | "CUSTOM";

export interface Banner {
  id: string;
  name: string;
  placement: BannerPlacement;
  customKey: string | null;
  title: string | null;
  subtitle: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  image: string;
  imageMobile: string | null;
  alt: string | null;
  bgColor: string | null;
  textColor: string | null;
  linkUrl: string | null;
  targetCategory: { slug: string; name: string } | null;
  targetProduct: { slug: string; name: string } | null;
  position: number;
}

// Add to nexus object:
//
//   listBanners: (placement: BannerPlacement, customKey?: string) => {
//     const q = new URLSearchParams({ placement });
//     if (customKey) q.set("customKey", customKey);
//     return call<{ items: Banner[] }>(`/banners?${q}`);
//   },
```

### Render a homepage hero (carousel)

```tsx
// app/page.tsx — storefront homepage
import { nexus } from "@/lib/nexus";
import { HeroCarousel } from "./HeroCarousel";

export default async function HomePage() {
  const [{ items: heros }, { items: products }] = await Promise.all([
    nexus.listBanners("HOMEPAGE_HERO"),
    nexus.listProducts({ limit: 12 }),
  ]);

  return (
    <main>
      {heros.length > 0 && <HeroCarousel banners={heros} />}
      {/* …product grid… */}
    </main>
  );
}
```

```tsx
// app/HeroCarousel.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Banner } from "@/lib/nexus";

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  const b = banners[i];
  // Resolve link target — explicit linkUrl > target product > target category > ctaUrl
  const href =
    b.linkUrl ??
    (b.targetProduct ? `/products/${b.targetProduct.slug}` : null) ??
    (b.targetCategory ? `/categories/${b.targetCategory.slug}` : null) ??
    b.ctaUrl ??
    "#";

  return (
    <section
      className="relative w-full h-[60vh] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: b.bgColor ?? undefined, color: b.textColor ?? undefined }}
    >
      <Link href={href} className="absolute inset-0">
        {/* Mobile vs desktop image */}
        <picture>
          {b.imageMobile && <source media="(max-width: 640px)" srcSet={b.imageMobile} />}
          <img src={b.image} alt={b.alt ?? b.title ?? ""} className="w-full h-full object-cover" />
        </picture>
        {(b.title || b.subtitle) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            {b.title && <h1 className="text-4xl sm:text-6xl font-bold mb-3">{b.title}</h1>}
            {b.subtitle && <p className="text-lg sm:text-2xl opacity-90 max-w-2xl">{b.subtitle}</p>}
            {b.ctaText && (
              <span className="mt-6 inline-block px-6 py-3 rounded-md bg-white text-black font-medium">
                {b.ctaText}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Pagination dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-2 w-2 rounded-full ${idx === i ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
```

### Other placements — your layout choice

Each storefront decides how to render. A few patterns:

```tsx
// HOMEPAGE_SECONDARY — single full-width strip
const { items } = await nexus.listBanners("HOMEPAGE_SECONDARY");
const b = items[0]; // or render all stacked

// CATEGORY_TOP — show on category pages
const { items } = await nexus.listBanners("CATEGORY_TOP");

// CART_SIDEBAR — small upsell card
const { items } = await nexus.listBanners("CART_SIDEBAR");

// POPUP — modal triggered after delay or on exit-intent
const { items } = await nexus.listBanners("POPUP");
// Then your client component decides when to show it

// CUSTOM — your own keys
const { items } = await nexus.listBanners("CUSTOM", "black-friday-strip");
```

### Why this design

- **Multiple storefronts** can consume the same admin. Each frontend renders the same `HOMEPAGE_HERO` payload differently — one as carousel, another as side-by-side cards — without any backend change.
- **Marketing team** updates banners + scheduling without touching code or asking developers.
- **Scheduling is server-side**: `startsAt`/`endsAt` filter automatically. The storefront just asks "what's live now?" and gets back the right list.
- **Targeting baked in**: `targetProduct`/`targetCategory` come back resolved with slugs, so the storefront builds the right URL.
- **Theming overrides optional**: `bgColor` + `textColor` let marketing pick brand colors per banner; the storefront can apply or ignore.

---

## Coupon validation (optional pre-checkout preview)

Add a server action that previews discount before submission:

```ts
// app/api/validate-coupon/route.ts
import { NextResponse } from "next/server";
import { nexus } from "@/lib/nexus";

// Note: validateCoupon is a Server Action in admin, not a public endpoint.
// For storefront preview, you have two options:
// 1. Replicate the math client-side (simple coupon types only)
// 2. Add a thin /api/public/v1/coupons/validate endpoint (recommended for production)
//
// For now, the math is simple enough to mirror:
// - PERCENTAGE: subtotal * value/100, capped by maxDiscount
// - FIXED: min(value, subtotal)
// - FREE_SHIPPING: shipping=0
// Just trust the server total returned in the checkout response.
```

---

## Production checklist

- [ ] API key stored in storefront's server env, never in client bundle
- [ ] Storefront `/api/checkout` Route Handler validates input before calling nexus
- [ ] CSRF protection on storefront's checkout form (Next.js + cookies-based)
- [ ] Stripe / payment gateway wired on the admin side (Phase 7) — checkoutUrl will be populated
- [ ] Email confirmations from admin's Resend integration when order created
- [ ] Image domains added to storefront's `next.config.ts` `images.remotePatterns`
- [ ] Storefront sets ISR `revalidate: 60` on product pages, `cache: "no-store"` on cart/checkout
- [ ] Rate limit aware on storefront — 120/min/key is plenty for one storefront, but watch headers in logs

---

## Multiple storefronts?

Each storefront gets its own API key with appropriately-scoped permissions. The admin's API key list shows `lastUsedAt` per key — easy to spot abandoned keys.
