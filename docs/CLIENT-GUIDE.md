# Store Owner's Guide — NexusAdmin

A complete, non-technical walkthrough of your admin panel. Everything you need to run your store day-to-day.

> Need help? You don't need to know any code. Every action in this guide is just clicking buttons.

---

## Table of contents

1. [Logging in](#1-logging-in)
2. [Tour of the dashboard](#2-tour-of-the-dashboard)
3. [Adding a new product](#3-adding-a-new-product)
4. [Setting a sale price / discount %](#4-setting-a-sale-price--discount-)
5. [Managing stock (in stock, low stock, sold out)](#5-managing-stock-in-stock-low-stock-sold-out)
6. [Hiding a product without deleting it](#6-hiding-a-product-without-deleting-it)
7. [Categories — how they work](#7-categories--how-they-work)
8. [Banners — the rotating images on your storefront](#8-banners--the-rotating-images-on-your-storefront)
9. [Coupons & promotions](#9-coupons--promotions)
10. [Orders — viewing, updating, fulfilling](#10-orders--viewing-updating-fulfilling)
11. [Refunds](#11-refunds)
12. [Customers](#12-customers)
13. [Analytics — understanding the numbers](#13-analytics--understanding-the-numbers)
14. [Settings — store info, contact details, email](#14-settings--store-info-contact-details-email)
15. [User roles (giving access to your team)](#15-user-roles-giving-access-to-your-team)
16. [Notification bell](#16-notification-bell)
17. [Common questions](#17-common-questions)

---

## 1. Logging in

1. Open your admin URL (your developer will give you the link, e.g. `https://admin.yourstore.com`).
2. Enter your **email** and **password**.
3. Click **Sign in**.

> First time? Use the credentials your developer set up. Change your password immediately by clicking your initials (top-right) → **Account settings**.

---

## 2. Tour of the dashboard

When you log in, you land on the **Dashboard**. This is your store's home screen.

**What you see at the top:**
- **Revenue** — total sales (today vs. last week)
- **Orders** — how many orders came in
- **Customers** — how many shoppers you have
- **Conversion** — what % of visitors actually bought

**Below:**
- **Revenue graph** — your sales trend for the last 7 days
- **Low stock alerts** — products running out (so you can reorder)
- **Recent orders** — the last 5 orders, click any to see details

**Left sidebar — your navigation:**
| Menu | What it's for |
|---|---|
| **Dashboard** | Home screen, overview |
| **Products** | All your items for sale |
| **Categories** | How products are grouped (Perfumes, Beauty, etc.) |
| **Orders** | Every order placed by customers |
| **Customers** | List of everyone who's bought from you |
| **Promotions** | Discount coupons, flash sales |
| **Banners** | The big rotating images on your storefront homepage |
| **Analytics** | Detailed reports — top products, revenue trends, etc. |
| **Payments** | Records of money received |
| **Settings** | Store name, contact info, your password, team members |

---

## 3. Adding a new product

1. Click **Products** in the sidebar.
2. Click **+ New product** (top right).
3. Fill in the **General** tab:
   - **Name** — the product name customers see (e.g. "Mehboob Eau de Parfum")
   - **Slug** — auto-filled from the name. This becomes the URL. Leave it as-is unless you want to customize.
   - **SKU** — your internal code (e.g. "MEH-50"). Optional but useful.
   - **Description** — full product description. Talk about ingredients, scent notes, sizes, what makes it special.
4. Switch to the **Pricing** tab:
   - **Selling price** — what customers actually pay (e.g. `4500` for Rs 4,500)
   - **Discount %** — optional. Enter a number like `20` and the system auto-fills the "Original price" so the storefront shows "−20% off"
   - **Original price** — the crossed-out higher price (auto-filled when you set Discount %, OR you can type it directly)
   - **Cost per unit** — what *you* paid for it. Customers never see this. Used for profit reports.
   - **Charge tax** — toggle on if this product is taxable.
5. Switch to the **Variants** tab if your product has options (sizes, colors):
   - Click **+ Add option** → type "Size" → add values like "50ml", "100ml"
   - The system auto-creates a row for each combination. Set the price + stock for each.
   - For a simple product (no options), one default variant is enough.
6. Switch to the **Media** tab and upload **at least one image**. Drag-drop or click to browse.
7. Switch to **Organization** to pick a **Category** and add **Tags**.
8. (Optional) **SEO** tab — custom title and description for Google.
9. Top-right: choose status **Active** (visible on storefront), **Draft** (hidden, work-in-progress), or **Archived** (hidden, kept for records).
10. Click **Save**.

> The product is now live (if Active) and appears in your storefront within seconds.

---

## 4. Setting a sale price / discount %

You have **three ways** to put a product on sale. All do the same thing — pick whichever is easiest.

**Way 1: Enter the discount %**
- Open the product → **Pricing** tab
- Type `20` in the **Discount %** field
- System auto-fills the "Original price"
- Storefront immediately shows "−20% off" badge

**Way 2: Enter the original price**
- Type the higher "Original price" directly (e.g. `6000` if selling at `4500`)
- System auto-calculates the discount % (here: 25%)

**Way 3: Per-variant discount**
- Go to the **Variants** tab
- Each variant row has its own "Compare-at" and "Off %" column
- Different sizes can have different discounts (e.g. 50ml at -10%, 100ml at -25%)

**Live preview:**
You'll see a green box at the bottom of the Pricing tab:
> Sale preview: ~~Rs 12,500~~ **Rs 9,500** — −24% off

This is exactly how it will look on your storefront.

**To remove a sale:** Clear the Discount % field (set to blank or 0). Product goes back to full price.

---

## 5. Managing stock (in stock, low stock, sold out)

Every product **variant** has a stock number.

**To update stock:**
1. Open the product → **Variants** tab
2. Each row has a **Stock** column
3. Type the new number → click **Save**

**What customers see:**
- **Stock > 5** → "In stock", green dot
- **Stock = 1–5** → "In stock — only 3 left", yellow warning (creates urgency)
- **Stock = 0** → **"Sold out"** badge, Add-to-cart button hidden

**Low stock alerts:**
- Each variant has a **Low @** field (default: 5)
- When stock drops below this number, the product appears in the Dashboard's "Low stock alerts" panel
- Also shows a "Low stock" badge in your admin product list

**Pro tip:** If you want to mark something **sold out temporarily** without affecting the real stock count, just set stock to 0. When new inventory arrives, set it back.

---

## 6. Hiding a product without deleting it

Sometimes you want to take a product off the storefront without losing its data.

**Three statuses:**
| Status | Visible to customers? | Use case |
|---|---|---|
| **Active** | ✅ Yes | Normal — for sale |
| **Draft** | ❌ No | Still writing, not ready yet |
| **Archived** | ❌ No | Old product, no longer selling, but keep history |

**To change:** Open the product → top-right dropdown → pick a status → Save.

> **Never delete** a product that has orders attached. Order history depends on it. Archive instead.

---

## 7. Categories — how they work

Categories group products together (e.g. "Perfumes", "Attars", "Beauty", "Gift Sets").

**To add a category:**
1. Click **Categories** in sidebar
2. Click **+ New category**
3. Enter the **Name** (slug auto-fills)
4. (Optional) Upload a **category image** — shown on your storefront category page
5. Save

**To assign a product to a category:**
- Open the product → **Organization** tab → pick the category from the dropdown

**To delete a category:**
- Categories with products attached can't be deleted directly. First move those products to another category, then delete.

**Tip:** Categories appear automatically in your storefront navigation. They also show in the sidebar of your Shop page with a product count next to each one.

---

## 8. Banners — the rotating images on your storefront

Banners are the big promotional images on your storefront homepage (and other slots).

**Where banners appear:**
| Placement | Where on storefront |
|---|---|
| `HOMEPAGE_HERO` | Big rotating slider at the top of homepage |
| `HOMEPAGE_SECONDARY` | Smaller banner row mid-page |
| `HOMEPAGE_FOOTER` | Bottom of homepage |
| `CATEGORY_TOP` | Top of a category page |
| `PRODUCT_DETAIL_SIDE` | Side panel of a product page |
| `CHECKOUT_TOP` | Top of checkout |
| `POPUP` | A modal/popup (e.g. "Welcome 10% off") |
| `CUSTOM` | Any custom slot — your developer assigns a key |

**To add a banner:**
1. Click **Banners** → **+ New banner**
2. Enter:
   - **Name** — internal name (e.g. "Eid Sale Hero")
   - **Placement** — pick where it should appear (e.g. HOMEPAGE_HERO)
   - **Title** + **Subtitle** — the headline text shown on the image
   - **CTA text** + **CTA URL** — the button (e.g. "Shop now" → /shop)
   - **Image** — upload a high-quality image
   - **Image (mobile)** — optional, a vertical version for phones
   - **Background color** + **Text color** — optional, for overlay styling
   - **Target category** or **Target product** — optional, links the banner to a specific page
   - **Starts at** + **Ends at** — optional. Banner only shows during this window (perfect for sales, Eid, Black Friday)
   - **Position** — order if you have multiple banners in the same slot (lower number = shown first)
3. Toggle **Active** on
4. Save

**Banner will appear on your storefront within 30 seconds.**

> **Tip:** For a slider, add 3–5 banners with the same placement (HOMEPAGE_HERO). They'll auto-rotate.

---

## 9. Coupons & promotions

**To create a coupon:**
1. Click **Promotions** → **+ New coupon**
2. Enter:
   - **Code** — what customers type at checkout (e.g. "EID25"). Must be unique.
   - **Type** — Percentage off, Fixed amount off, or Free shipping
   - **Value** — the number (25 for 25%, 500 for Rs 500 off)
   - **Min purchase** — optional minimum order amount required
   - **Max discount** — optional cap (so a 25% off code on a Rs 100,000 order doesn't cost you Rs 25,000)
   - **Usage limit** — how many times this code can be used in total
   - **Per-customer limit** — how many times one customer can use it
   - **Starts at** / **Expires at** — when the coupon is valid
   - **Applies to** — All products, specific products, or specific categories
3. Toggle **Active** → Save

**Customers enter the code at checkout** and get the discount applied automatically.

**To see how a coupon is performing:** Open it — you'll see usage count and total discount given.

---

## 10. Orders — viewing, updating, fulfilling

**To view orders:**
1. Click **Orders** in sidebar
2. You see a table: Order #, Customer, Status, Payment, Items, Total, Date
3. **Filter** by status (Pending, Processing, Shipped, etc.) or payment status using the dropdowns at the top
4. **Search** by order number or customer email

**To open an order:**
- Click the order number — you go to the order detail page

**On the order detail page you can:**
- See all items (name, variant, qty, unit price)
- See the customer's name, email, phone
- See shipping + billing addresses
- See the payment method (COD, JazzCash, etc.) and payment status
- See a **Timeline** showing every status change
- Click **Update status** to change it:
  - **PENDING** → just placed, awaiting action
  - **PROCESSING** → you're preparing it
  - **SHIPPED** → handed to courier
  - **DELIVERED** → customer received it
  - **CANCELLED** → cancelled before shipping
  - **REFUNDED** → money returned
- Click **Add tracking** → enter the courier name + tracking number → customer gets notified

**Typical workflow:**
1. New order arrives (status: PENDING, you get an email + notification)
2. Pack the items → change status to PROCESSING
3. Hand to courier → change status to SHIPPED, add tracking number
4. Courier delivers → change status to DELIVERED

**Invoices:** Click **Invoice** on the order detail page to generate a PDF invoice you can print or email.

---

## 11. Refunds

**To process a refund:**
1. Open the order → click **Issue refund**
2. Enter the amount (full refund or partial)
3. Choose the reason
4. Click Confirm

**For card payments (Stripe):** the refund goes back to the customer's card automatically (5–7 business days).

**For COD / wallet payments:** you'll need to refund manually (cash back / bank transfer) and mark the refund in admin so records are clean.

---

## 12. Customers

**To view customers:**
1. Click **Customers** in sidebar
2. You see a table with everyone who's placed an order
3. Click a customer to see their full history: every order, total spent, default address

**Total spent** and **order count** are tracked automatically — useful for spotting VIPs.

> Customer accounts are optional in your store. Most orders come from guest checkout — but the customer record is still created automatically.

---

## 13. Analytics — understanding the numbers

Click **Analytics** in sidebar.

**Reports available:**
- **Revenue trend** — sales over time (7 days, 30 days, 90 days)
- **Top products** — which items are selling most
- **Top categories** — which categories are bringing in revenue
- **Customer growth** — new customers per period
- **Conversion rate** — % of visitors who buy
- **Average order value** — what people typically spend

**Export:** Most reports have an **Export CSV** button — open in Excel for deeper analysis.

---

## 14. Settings — store info, contact details, email

Click **Settings** in sidebar.

**Things you can change:**
- **Store name** — e.g. "Noor — Perfumes & Beauty"
- **Legal name** — for invoices (e.g. "Noor Perfumes (Pvt) Ltd")
- **Email** — this is where **new-order notifications are sent**. Change this and emails immediately go to the new address.
- **Phone** — shown in the storefront footer and on contact pages
- **Logo** + **Favicon** — your branding
- **Currency** — currently PKR
- **Locale** — language/region for date formatting
- **Timezone** — Asia/Karachi
- **Tax rate** — % charged on taxable products
- **Address** — your business address
- **Social media URLs** — Instagram, Facebook, Twitter (shown in footer)
- **API keys** — for integrations (mostly your developer's job)

> **Important:** Whenever you change the store email here, ALL future order alerts go to that new address. No code change needed.

---

## 15. User roles (giving access to your team)

Click **Settings** → **Team / Users**.

**Roles:**
| Role | What they can do |
|---|---|
| **SUPER_ADMIN** | Everything, including managing other users |
| **ADMIN** | Everything except managing users / store settings |
| **MANAGER** | Manage products, orders, customers. No refunds, no settings. |
| **VIEWER** | Read-only — can see everything, change nothing |

**To add a user:**
1. Click **+ Invite user**
2. Enter their email + name
3. Pick a role
4. They get an invite email to set their password

**To deactivate:** Click the user → toggle **Active** off. They keep their record but can't log in.

> **Safety:** You can't deactivate yourself or change your own role. This prevents lockouts.

---

## 16. Notification bell

Top-right corner of every admin page — the 🔔 bell icon.

**A red dot appears when there's new activity.** Click to see:
- New orders placed
- Low stock warnings
- New refunds processed
- Webhook events (payment confirmations from Stripe/JazzCash/etc.)

**"Mark all read"** clears the red dot. Unread items have a small purple dot next to them.

**Items show the last 7 days.** For older activity, use the relevant section (Orders, Products, etc.).

---

## 17. Common questions

**Q: I added a product but it's not showing on the storefront. Why?**
A: Three things to check:
1. Is the product status set to **Active** (not Draft/Archived)?
2. Does the product have at least one **variant with stock > 0**?
3. Did you upload an image? (Products without images still show, but with a placeholder)

**Q: I changed a price but the storefront still shows the old price.**
A: The storefront caches data for a couple of minutes for performance. Wait 60–120 seconds and refresh. If it still doesn't update, ask your developer to "clear the cache".

**Q: A customer says they didn't receive the order confirmation email.**
A: Check the order detail page — is their email correct? Also ask them to check spam. Confirmation emails come from `noreply@yourstore.com`.

**Q: How do I change the storefront's logo / colors / fonts?**
A: Logo: Settings → upload new Logo. Colors/fonts: this is a code-level change — ask your developer.

**Q: Can I mark a product "Coming soon" without selling it?**
A: Yes — set status to **Draft**. Or keep it Active but set all variant stock to 0 (shows "Sold out").

**Q: How do I close my store temporarily (holiday, vacation)?**
A: Currently you'd need to either: (a) archive all products, or (b) add a "We're on break" banner. A "store mode" toggle isn't built in yet — ask your developer to add one if needed.

**Q: What payment methods can my customers use?**
A: COD, JazzCash, Easypaisa, Debit/Credit Card. Other methods can be added by your developer.

**Q: How do I see how much money I made this month?**
A: Dashboard shows last 7 days. For longer windows, go to Analytics → Revenue trend → pick the date range.

**Q: Can I bulk-import products from a spreadsheet?**
A: Yes — Products → **Import CSV**. Download the template, fill it in, upload. Useful for adding 100+ products at once.

**Q: How are out-of-stock products handled?**
A: Stock = 0 → "Sold out" badge appears, Add-to-cart button is hidden. Product stays visible (so customers know it exists), but they can't buy.

**Q: A customer wants to cancel their order — what do I do?**
A: Open the order → Update status → **CANCELLED**. Stock is restored automatically. If they already paid, issue a refund.

---

## Need more help?

- **Storefront issues** (broken layout, missing images): contact your developer.
- **Admin issues** (can't log in, missing menu): try refreshing first. If it persists, contact your developer.
- **Payment problems** (Stripe/JazzCash errors): check Settings → Integrations to confirm keys are set.

Bookmark this page. It's your operating manual.
