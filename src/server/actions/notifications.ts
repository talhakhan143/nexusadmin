"use server";

import { db } from "@/server/db";
import { auth } from "@/server/auth";

export interface NotificationItem {
  id: string;
  type: "order" | "low_stock" | "refund" | "webhook";
  title: string;
  description: string;
  href: string;
  createdAt: Date;
}

/**
 * Aggregate recent activity from across the store for the bell dropdown.
 * Returns up to ~10 most recent items.
 */
export async function getNotifications(): Promise<NotificationItem[]> {
  const session = await auth();
  if (!session?.user) return [];

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [orders, lowStock, refunds, webhooks] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true, email: true } } },
    }),
    db.productVariant.findMany({
      where: { stock: { lte: 5 }, product: { status: "ACTIVE" } },
      orderBy: { stock: "asc" },
      take: 5,
      include: { product: { select: { id: true, name: true } } },
    }),
    db.refund.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { order: { select: { id: true, orderNumber: true, currency: true } } },
    }),
    db.auditLog.findMany({
      where: { entity: "Webhook", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const items: NotificationItem[] = [
    ...orders.map((o) => ({
      id: `order-${o.id}`,
      type: "order" as const,
      title: `New order ${o.orderNumber}`,
      description: `${o.customer?.name ?? o.customer?.email ?? "Guest"} · ${o.status}`,
      href: `/orders/${o.id}`,
      createdAt: o.createdAt,
    })),
    ...lowStock.map((v) => ({
      id: `stock-${v.id}`,
      type: "low_stock" as const,
      title: v.stock === 0 ? "Out of stock" : `Low stock (${v.stock} left)`,
      description: `${v.product.name}${v.name ? ` · ${v.name}` : ""}`,
      href: `/products/${v.product.id}`,
      createdAt: v.updatedAt ?? new Date(),
    })),
    ...refunds.map((r) => ({
      id: `refund-${r.id}`,
      type: "refund" as const,
      title: `Refund $${(r.amount / 100).toFixed(2)}`,
      description: `Order ${r.order.orderNumber} · ${r.status}`,
      href: `/orders/${r.order.id}`,
      createdAt: r.createdAt,
    })),
    ...webhooks.map((w) => ({
      id: `wh-${w.id}`,
      type: "webhook" as const,
      title: w.action,
      description: `Webhook event · ${w.entityId?.slice(-8) ?? ""}`,
      href: "/payments",
      createdAt: w.createdAt,
    })),
  ];

  return items
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);
}
