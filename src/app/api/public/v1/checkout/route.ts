import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { verifyApiKey, withRateHeaders } from "@/server/api-auth";
import { checkoutSchema } from "@/lib/validations/checkout";
import { generateOrderNumber } from "@/lib/utils";
import { getProvider } from "@/server/payments";
import { sendOrderConfirmation, sendNewOrderAlert } from "@/lib/email/order-emails";

/**
 * POST /api/public/v1/checkout
 * Auth: Bearer <api_key>  ·  Scope: orders:write
 *
 * Creates a Customer (or reuses by email) + Order + items + addresses.
 * Optionally applies a coupon. Returns the new order with a checkout URL stub.
 */
export async function POST(req: Request) {
  const ctx = await verifyApiKey(req, "orders:write");
  if (ctx instanceof Response) return ctx;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input", issues: parsed.error.errors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // ── Resolve variants (with snapshot of price + product info) ──
  const variantIds = data.items.map((i) => i.variantId);
  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { select: { id: true, name: true, status: true, taxable: true } }, options: true },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  for (const item of data.items) {
    const v = byId.get(item.variantId);
    if (!v) {
      return NextResponse.json({ error: `Variant ${item.variantId} not found` }, { status: 400 });
    }
    if (v.product.status !== "ACTIVE") {
      return NextResponse.json({ error: `Product "${v.product.name}" is not available` }, { status: 400 });
    }
    if (v.stock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for "${v.product.name}" (${v.name ?? ""}). Have ${v.stock}, want ${item.quantity}.` },
        { status: 409 }
      );
    }
  }

  // ── Pricing ──
  let subtotal = 0;
  let taxableSubtotal = 0;
  for (const item of data.items) {
    const v = byId.get(item.variantId)!;
    const lineTotal = v.price * item.quantity;
    subtotal += lineTotal;
    if (v.product.taxable) taxableSubtotal += lineTotal;
  }

  const store = await db.store.findFirst();
  const taxRate = (store?.taxRate ?? 0) / 100;
  const taxAmount = Math.round(taxableSubtotal * taxRate);
  let shippingAmount = data.shippingAmount;
  let discountAmount = 0;
  let couponId: string | null = null;

  if (data.couponCode) {
    const coupon = await db.coupon.findUnique({ where: { code: data.couponCode.trim().toUpperCase() } });
    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
    }
    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) return NextResponse.json({ error: "Coupon not started" }, { status: 400 });
    if (coupon.expiresAt && now > coupon.expiresAt) return NextResponse.json({ error: "Coupon expired" }, { status: 400 });
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Coupon exhausted" }, { status: 400 });
    }
    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      return NextResponse.json(
        { error: `Min purchase $${(coupon.minPurchase / 100).toFixed(2)}` },
        { status: 400 }
      );
    }
    if (coupon.type === "PERCENTAGE") {
      discountAmount = Math.round(subtotal * (coupon.value / 100));
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else if (coupon.type === "FIXED") {
      discountAmount = Math.min(coupon.value, subtotal);
    } else if (coupon.type === "FREE_SHIPPING") {
      shippingAmount = 0;
    }
    couponId = coupon.id;
  }

  const total = Math.max(0, subtotal + taxAmount + shippingAmount - discountAmount);

  // ── Customer (upsert by email) ──
  const customer = await db.customer.upsert({
    where: { email: data.customer.email },
    create: {
      email: data.customer.email,
      name: data.customer.name ?? null,
      phone: data.customer.phone ?? null,
      acceptsMarketing: data.customer.acceptsMarketing,
    },
    update: {
      name: data.customer.name ?? undefined,
      phone: data.customer.phone ?? undefined,
      acceptsMarketing: data.customer.acceptsMarketing,
    },
  });

  // ── Addresses ──
  const shipping = await db.address.create({
    data: { ...data.shippingAddress, customerId: customer.id, type: "SHIPPING" },
  });
  const billing = data.billingAddress
    ? await db.address.create({
        data: { ...data.billingAddress, customerId: customer.id, type: "BILLING" },
      })
    : shipping;

  // ── Order + items + history (transactional) + stock decrement ──
  const orderNumber = generateOrderNumber();
  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: data.paymentMethod ?? "COD",
        currency: store?.currency ?? "USD",
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount,
        total,
        billingAddressId: billing.id,
        shippingAddressId: shipping.id,
        couponId,
        notes: data.notes ?? null,
        items: {
          create: data.items.map((item) => {
            const v = byId.get(item.variantId)!;
            const optStr = v.options.map((o) => `${o.name}: ${o.value}`).join(", ");
            return {
              productId: v.product.id,
              variantId: v.id,
              quantity: item.quantity,
              unitPrice: v.price,
              total: v.price * item.quantity,
              productSnapshot: JSON.stringify({
                name: v.product.name,
                variantName: v.name ?? optStr,
                sku: v.sku ?? "",
                options: v.options.map((o) => ({ name: o.name, value: o.value })),
              }),
            };
          }),
        },
        statusHistory: { create: [{ toStatus: "PENDING", note: "Created via public API" }] },
      },
    });

    // Decrement stock + log
    for (const item of data.items) {
      const v = byId.get(item.variantId)!;
      await tx.productVariant.update({
        where: { id: v.id },
        data: { stock: { decrement: item.quantity } },
      });
      await tx.inventoryLog.create({
        data: {
          variantId: v.id,
          change: -item.quantity,
          reason: "ORDER_PLACED",
          note: `Order ${orderNumber}`,
        },
      });
    }
    if (couponId) {
      await tx.coupon.update({ where: { id: couponId }, data: { usageCount: { increment: 1 } } });
    }
    return created;
  });

  // ── Email notifications (fire-and-forget — don't block response) ──
  const emailPayload = {
    orderNumber: order.orderNumber,
    customerName: data.customer.name ?? null,
    customerEmail: data.customer.email,
    customerPhone: data.customer.phone ?? null,
    items: data.items.map((item) => {
      const v = byId.get(item.variantId)!;
      const optStr = v.options.map((o) => `${o.name}: ${o.value}`).join(", ");
      return {
        name: v.product.name,
        variantName: v.name ?? optStr,
        quantity: item.quantity,
        unitPrice: v.price,
        total: v.price * item.quantity,
      };
    }),
    subtotal,
    shippingAmount,
    discountAmount,
    taxAmount,
    total,
    currency: order.currency,
    paymentMethod: order.paymentMethod ?? "COD",
    shippingAddress: {
      line1: data.shippingAddress.line1,
      line2: data.shippingAddress.line2 ?? null,
      city: data.shippingAddress.city,
      state: data.shippingAddress.state ?? null,
      country: data.shippingAddress.country,
      postalCode: data.shippingAddress.postalCode,
    },
    notes: data.notes ?? null,
    storeName: store?.name ?? "NexusAdmin Store",
    trackingUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/order/${order.orderNumber}?email=${encodeURIComponent(data.customer.email)}`,
  };

  Promise.allSettled([
    sendOrderConfirmation(emailPayload, data.customer.email),
    store?.email ? sendNewOrderAlert(emailPayload, store.email) : Promise.resolve(),
  ]).catch((e) => console.warn("[checkout] email dispatch failed:", e));

  // ── Provider-aware checkoutUrl ──
  // COD goes straight through (no payment URL needed). For everything else,
  // try to create a hosted-checkout redirect. If the provider isn't configured
  // we still return the order — admin can mark it paid manually.
  let checkoutUrl: string | null = null;
  const method = (data.paymentMethod ?? "COD").toUpperCase();
  if (method !== "COD") {
    const providerKey = method === "JAZZCASH" ? "jazzcash"
      : method === "EASYPAISA" ? "easypaisa"
      : method === "CARD" || method === "STRIPE" ? "stripe"
      : null;
    const provider = providerKey ? getProvider(providerKey) : null;
    if (provider && provider.isConfigured()) {
      try {
        const successUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/payments/return?order=${order.orderNumber}&email=${encodeURIComponent(data.customer.email)}`;
        const cancelUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/payments/cancel?order=${order.orderNumber}`;
        const session = await provider.createCheckout({
          orderId: order.id,
          amount: total,
          currency: order.currency,
          customerEmail: data.customer.email,
          successUrl,
          cancelUrl,
          description: `Order ${order.orderNumber}`,
        });
        checkoutUrl = session.checkoutUrl;
      } catch (e) {
        console.warn(`[checkout] Provider ${providerKey} createCheckout failed:`, (e as Error).message);
      }
    }
  }

  return withRateHeaders(
    NextResponse.json(
      {
        orderNumber: order.orderNumber,
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        currency: order.currency,
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount,
        total,
        checkoutUrl,
      },
      { status: 201 }
    ),
    ctx
  );
}
