"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { requirePermission } from "@/lib/rbac";
import {
  updateStatusSchema,
  updateTrackingSchema,
  refundSchema,
  type UpdateStatusInput,
  type UpdateTrackingInput,
  type RefundInput,
} from "@/lib/validations/order";
import { generateOrderNumber } from "@/lib/utils";
import { toCsv } from "@/lib/csv";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

// Status workflow — defines allowed forward transitions
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export async function updateOrderStatus(orderId: string, input: UpdateStatusInput): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "orders:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Order not found" };

  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed.includes(parsed.data.status) && parsed.data.status !== order.status) {
    return {
      ok: false,
      error: `Cannot move ${order.status} → ${parsed.data.status}. Allowed: ${allowed.join(", ") || "none"}.`,
    };
  }

  const now = new Date();
  const data: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "SHIPPED") data.shippedAt = now;
  if (parsed.data.status === "DELIVERED") data.deliveredAt = now;
  if (parsed.data.status === "CANCELLED") data.cancelledAt = now;

  await db.$transaction([
    db.order.update({ where: { id: orderId }, data }),
    db.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: parsed.data.status,
        changedById: session?.user?.id ?? null,
        note: parsed.data.note ?? null,
      },
    }),
  ]);

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

export async function updateOrderTracking(orderId: string, input: UpdateTrackingInput): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "orders:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = updateTrackingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  await db.order.update({
    where: { id: orderId },
    data: {
      trackingNumber: parsed.data.trackingNumber,
      trackingUrl: parsed.data.trackingUrl || null,
    },
  });
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

export async function processRefund(orderId: string, input: RefundInput): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "orders:refund");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = refundSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { refunds: true },
  });
  if (!order) return { ok: false, error: "Order not found" };

  const alreadyRefunded = order.refunds
    .filter((r) => r.status === "COMPLETED")
    .reduce((s, r) => s + r.amount, 0);
  const remaining = order.total - alreadyRefunded;
  if (parsed.data.amount > remaining) {
    return { ok: false, error: `Refund exceeds refundable amount ($${(remaining / 100).toFixed(2)})` };
  }

  const newRefundedTotal = alreadyRefunded + parsed.data.amount;
  const paymentStatus: PaymentStatus =
    newRefundedTotal >= order.total ? "REFUNDED" : "PARTIALLY_REFUNDED";

  await db.$transaction([
    db.refund.create({
      data: {
        orderId,
        amount: parsed.data.amount,
        reason: parsed.data.reason ?? null,
        status: "COMPLETED",
        processedById: session?.user?.id ?? null,
      },
    }),
    db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
        ...(paymentStatus === "REFUNDED" && {
          status: "REFUNDED",
        }),
      },
    }),
    ...(paymentStatus === "REFUNDED"
      ? [
          db.orderStatusHistory.create({
            data: {
              orderId,
              fromStatus: order.status,
              toStatus: "REFUNDED" as OrderStatus,
              changedById: session?.user?.id ?? null,
              note: `Refund processed: $${(parsed.data.amount / 100).toFixed(2)}`,
            },
          }),
        ]
      : []),
  ]);

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { ok: true };
}

export async function exportOrdersCsv(): Promise<ActionResult<{ csv: string; count: number }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "orders:read");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const orders = await db.order.findMany({
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
  });
  const rows = orders.map((o) => ({
    orderNumber: o.orderNumber,
    date: o.createdAt.toISOString(),
    customer: o.customer?.email ?? "",
    customerName: o.customer?.name ?? "",
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod ?? "",
    items: o.items.length,
    subtotal: (o.subtotal / 100).toFixed(2),
    tax: (o.taxAmount / 100).toFixed(2),
    shipping: (o.shippingAmount / 100).toFixed(2),
    discount: (o.discountAmount / 100).toFixed(2),
    total: (o.total / 100).toFixed(2),
    currency: o.currency,
    trackingNumber: o.trackingNumber ?? "",
  }));
  return { ok: true, data: { csv: toCsv(rows), count: rows.length } };
}

/**
 * Dev helper — seeds 6 sample orders against existing customers + products.
 * Idempotent-ish: skipped if there are already ≥ 6 orders.
 */
export async function seedDemoOrders(): Promise<ActionResult<{ created: number }>> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return { ok: false, error: "Super admin only" };
  }

  const existing = await db.order.count();
  if (existing >= 6) {
    return { ok: true, data: { created: 0 } };
  }

  const customers = await db.customer.findMany({ take: 5 });
  const variants = await db.productVariant.findMany({
    include: { product: true },
    take: 8,
  });
  if (customers.length === 0 || variants.length === 0) {
    return { ok: false, error: "Need at least 1 customer + 1 variant before seeding orders" };
  }

  const STATUSES: { status: OrderStatus; payment: PaymentStatus }[] = [
    { status: "PENDING", payment: "PENDING" },
    { status: "PROCESSING", payment: "PAID" },
    { status: "SHIPPED", payment: "PAID" },
    { status: "DELIVERED", payment: "PAID" },
    { status: "CANCELLED", payment: "FAILED" },
    { status: "REFUNDED", payment: "REFUNDED" },
  ];

  let created = 0;
  for (const flow of STATUSES) {
    const customer = customers[created % customers.length];
    const items = [
      variants[created % variants.length],
      variants[(created + 1) % variants.length],
    ];
    const subtotal = items.reduce((s, v, i) => s + v.price * (i + 1), 0);
    const tax = Math.round(subtotal * 0.075);
    const shipping = 500;
    const total = subtotal + tax + shipping;

    const address = await db.address.create({
      data: {
        customerId: customer.id,
        type: "BOTH",
        firstName: customer.name?.split(" ")[0] ?? "Demo",
        lastName: customer.name?.split(" ").slice(1).join(" ") ?? "",
        line1: `${100 + created} Sample Street`,
        city: "New York",
        state: "NY",
        country: "US",
        postalCode: "10001",
        phone: customer.phone,
      },
    });

    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: customer.id,
        status: flow.status,
        paymentStatus: flow.payment,
        paymentMethod: "STRIPE",
        currency: "USD",
        subtotal,
        taxAmount: tax,
        shippingAmount: shipping,
        discountAmount: 0,
        total,
        billingAddressId: address.id,
        shippingAddressId: address.id,
        ...(flow.status === "SHIPPED" && {
          trackingNumber: `TRK${1000000 + created}`,
          shippedAt: new Date(),
        }),
        ...(flow.status === "DELIVERED" && {
          trackingNumber: `TRK${1000000 + created}`,
          shippedAt: new Date(Date.now() - 3 * 86400_000),
          deliveredAt: new Date(),
        }),
        ...(flow.status === "CANCELLED" && { cancelledAt: new Date() }),
        items: {
          create: items.map((v, i) => ({
            productId: v.productId,
            variantId: v.id,
            productSnapshot: JSON.stringify({
              name: v.product.name,
              variantName: v.name ?? "",
              sku: v.sku ?? "",
            }),
            quantity: i + 1,
            unitPrice: v.price,
            total: v.price * (i + 1),
          })),
        },
        statusHistory: {
          create: [{ toStatus: flow.status, note: "Seeded order" }],
        },
        ...(flow.status === "REFUNDED" && {
          refunds: {
            create: { amount: total, status: "COMPLETED", reason: "Customer return" },
          },
        }),
      },
    });

    // Update customer aggregate
    if (flow.payment === "PAID" || flow.payment === "PARTIALLY_REFUNDED") {
      await db.customer.update({
        where: { id: customer.id },
        data: {
          totalSpent: { increment: total },
          ordersCount: { increment: 1 },
        },
      });
    }
    created++;
    void order;
  }

  revalidatePath("/orders");
  revalidatePath("/customers");
  revalidatePath("/");
  return { ok: true, data: { created } };
}
