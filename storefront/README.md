# Noor — Storefront

Premium Pakistani perfume & beauty storefront, powered by [NexusAdmin](../README.md) public API.

Designed for international freelance clients building Pakistani e-commerce brands. Easy to rebrand, re-theme, and customize.

## What's inside

- **Next.js 16** App Router · React 19 · TypeScript strict · Tailwind v4
- **Cosmecos-inspired** layout — hero slider, category cards, bestsellers grid, sale countdown, testimonials, Instagram strip
- **PKR currency** formatted as `Rs 4,500` throughout
- **Cart** — zustand + localStorage persistence + slide-out drawer
- **Checkout** — COD, JazzCash, Easypaisa, Card (provider-agnostic; redirects to admin when configured)
- **Email-gated order tracking** at `/order/[orderNumber]?email=…`
- **Admin-driven content** — homepage hero banners, categories, products all from `/api/public/v1/*`
- **Multi-page** — Home, Shop, Category, Product, Cart, Checkout, Order tracking, About, Contact, FAQ, Shipping, Returns, Privacy, Terms, Account, Wishlist, 404
- **SEO-ready** — dynamic sitemap, robots.txt, OG metadata per product

## Quick start

```bash
# 1. Install
cd storefront
npm install

# 2. Configure
cp .env.local.example .env.local
# Edit ADMIN_API_KEY — generate one with:
#   cd .. && npx tsx scripts/create-storefront-key.ts

# 3. Run (admin must be on port 3000)
npm run dev   # storefront on port 3001
```

Visit http://localhost:3001.

## Architecture

```
storefront/
├── src/
│   ├── app/                  # routes (App Router)
│   ├── components/
│   │   ├── ui/               # button, input, sheet, badge…
│   │   ├── layout/           # header, footer, promo strip
│   │   ├── home/             # hero, category cards, sale banner, testimonials
│   │   ├── product/          # gallery, buy box, product card
│   │   ├── cart/             # drawer
│   │   └── checkout/         # (inline in checkout page)
│   ├── server/
│   │   └── actions.ts        # Server Actions wrapping API client
│   ├── lib/
│   │   ├── api-client.ts     # typed wrapper over admin /api/public/v1
│   │   ├── currency.ts       # formatPKR helpers
│   │   └── cn.ts
│   ├── store/
│   │   └── cart.ts           # zustand
│   ├── types/api.ts          # API response types
│   └── config/site.ts        # brand, nav, footer config
└── .env.local                # ADMIN_API_KEY (server-only)
```

### Data flow

```
Browser  →  Storefront Server (RSC)  →  Admin API (Bearer auth)  →  Postgres
                ↑                              ↓
                └──── Server Actions ─────────┘
                       (place order, etc)
```

The `ADMIN_API_KEY` lives **only on the storefront server**. All client interactions go through Server Components (reads) or Server Actions (writes). The browser never sees the API key.

## Rebrand for a client

1. Edit `src/config/site.ts` — change `name`, `tagline`, `description`, contact info, social URLs, payment methods.
2. Edit `src/app/globals.css` — tweak CSS variables (`--accent`, `--primary`, `--ivory`, etc.) for theme color.
3. Edit `tailwind.config.ts` — swap `gold`, `ink`, `ivory`, `blush` if needed.
4. Replace `public/` images (favicon, logo, OG fallback).
5. (Optional) Swap fonts in `src/app/layout.tsx` — currently Cormorant Garamond (display) + Inter (body).

That's it — full white-label.

## Payment provider setup

| Method | Status | Setup |
|---|---|---|
| **COD** | ✅ Live | Works out of the box. |
| **JazzCash** | 🟡 Stub | Set `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT` in admin `.env`. |
| **Easypaisa** | 🟡 Stub | Set `EASYPAISA_STORE_ID`, `EASYPAISA_HASH_KEY` in admin `.env`. |
| **Card** | 🟡 Stub | Routes through Stripe — set `STRIPE_SECRET_KEY`. |

Provider stubs return sandbox URLs so the UI flow can be tested. Wire real merchant accounts when going live.

## Deploy

Two separate Vercel projects, same git repo:

1. **Admin** — root directory `/`
2. **Storefront** — root directory `/storefront`

Each gets its own env vars + domain.

```bash
# Storefront env vars
ADMIN_API_URL=https://your-admin.vercel.app/api/public/v1
ADMIN_API_KEY=nx_live_xxx
NEXT_PUBLIC_SITE_NAME="Your Brand"
NEXT_PUBLIC_SITE_URL=https://your-shop.com
NEXT_PUBLIC_WHATSAPP=+923XXXXXXXXX
```
