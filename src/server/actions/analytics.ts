"use server";

import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { requirePermission } from "@/lib/rbac";
import { toCsv } from "@/lib/csv";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

export interface DateRange {
  from: Date;
  to: Date;
}

function parseRange(from?: string, to?: string): DateRange {
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(now.getDate() - 30);
  return {
    from: from ? new Date(from) : defaultFrom,
    to: to ? new Date(`${to}T23:59:59`) : now,
  };
}

function dateBucket(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Daily revenue + order count series across the date range.
 * Aggregates client-side to keep DB-engine-agnostic (works on SQLite + Postgres).
 */
export async function getRevenueSeries(from?: string, to?: string) {
  const range = parseRange(from, to);
  const orders = await db.order.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] },
    },
    select: { createdAt: true, total: true },
  });

  const map = new Map<string, { revenue: number; orders: number }>();
  // seed every day in range
  const cursor = new Date(range.from);
  while (cursor <= range.to) {
    map.set(dateBucket(cursor), { revenue: 0, orders: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const o of orders) {
    const k = dateBucket(o.createdAt);
    const cur = map.get(k) ?? { revenue: 0, orders: 0 };
    cur.revenue += o.total;
    cur.orders += 1;
    map.set(k, cur);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, revenue: v.revenue / 100, orders: v.orders }));
}

export async function getKpiSummary(from?: string, to?: string) {
  const range = parseRange(from, to);
  const where = {
    createdAt: { gte: range.from, lte: range.to },
  };
  const [paid, allOrders, customers, refundsAgg] = await Promise.all([
    db.order.aggregate({
      where: { ...where, paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
      _sum: { total: true },
      _count: true,
    }),
    db.order.count({ where }),
    db.customer.count({ where }),
    db.refund.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: range.from, lte: range.to } },
      _sum: { amount: true },
    }),
  ]);

  const grossRevenue = paid._sum.total ?? 0;
  const refunded = refundsAgg._sum.amount ?? 0;
  const netRevenue = grossRevenue - refunded;
  const aov = paid._count > 0 ? Math.round(grossRevenue / paid._count) : 0;
  const conversion = customers > 0 ? (allOrders / customers) * 100 : 0;

  return {
    grossRevenue,
    netRevenue,
    refunded,
    paidOrders: paid._count,
    totalOrders: allOrders,
    newCustomers: customers,
    aov,
    conversion,
  };
}

export async function getTopProducts(from?: string, to?: string, limit = 5) {
  const range = parseRange(from, to);
  const items = await db.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: range.from, lte: range.to },
        paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] },
      },
    },
    select: { productId: true, total: true, quantity: true },
  });

  const map = new Map<string, { revenue: number; units: number }>();
  for (const it of items) {
    if (!it.productId) continue;
    const cur = map.get(it.productId) ?? { revenue: 0, units: 0 };
    cur.revenue += it.total;
    cur.units += it.quantity;
    map.set(it.productId, cur);
  }
  if (map.size === 0) return [];

  const products = await db.product.findMany({
    where: { id: { in: Array.from(map.keys()) } },
    select: { id: true, name: true },
  });
  const byId = new Map(products.map((p) => [p.id, p.name]));

  return Array.from(map.entries())
    .map(([id, v]) => ({ id, name: byId.get(id) ?? "Unknown", revenue: v.revenue / 100, units: v.units }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getTopCategories(from?: string, to?: string, limit = 5) {
  const range = parseRange(from, to);
  const items = await db.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: range.from, lte: range.to },
        paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] },
      },
    },
    select: {
      total: true,
      quantity: true,
      product: { select: { categoryId: true } },
    },
  });
  const map = new Map<string, { revenue: number; units: number }>();
  for (const it of items) {
    const cid = it.product?.categoryId;
    if (!cid) continue;
    const cur = map.get(cid) ?? { revenue: 0, units: 0 };
    cur.revenue += it.total;
    cur.units += it.quantity;
    map.set(cid, cur);
  }
  if (map.size === 0) return [];

  const cats = await db.category.findMany({
    where: { id: { in: Array.from(map.keys()) } },
    select: { id: true, name: true },
  });
  const byId = new Map(cats.map((c) => [c.id, c.name]));
  return Array.from(map.entries())
    .map(([id, v]) => ({ id, name: byId.get(id) ?? "Unknown", revenue: v.revenue / 100, units: v.units }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getOrderStatusDistribution(from?: string, to?: string) {
  const range = parseRange(from, to);
  const orders = await db.order.findMany({
    where: { createdAt: { gte: range.from, lte: range.to } },
    select: { status: true },
  });
  const map = new Map<string, number>();
  for (const o of orders) map.set(o.status, (map.get(o.status) ?? 0) + 1);
  return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
}

export async function getCustomerGrowth(from?: string, to?: string) {
  const range = parseRange(from, to);
  const customers = await db.customer.findMany({
    where: { createdAt: { gte: range.from, lte: range.to } },
    select: { createdAt: true },
  });
  const map = new Map<string, number>();
  const cursor = new Date(range.from);
  while (cursor <= range.to) {
    map.set(dateBucket(cursor), 0);
    cursor.setDate(cursor.getDate() + 1);
  }
  let cumulative = await db.customer.count({ where: { createdAt: { lt: range.from } } });
  for (const c of customers) {
    const k = dateBucket(c.createdAt);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  const sorted = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([date, newCount]) => {
    cumulative += newCount;
    return { date, new: newCount, cumulative };
  });
}

export async function exportAnalyticsCsv(from?: string, to?: string): Promise<ActionResult<{ csv: string }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "analytics:read");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const series = await getRevenueSeries(from, to);
  return { ok: true, data: { csv: toCsv(series.map((d) => ({ date: d.date, revenue: d.revenue.toFixed(2), orders: d.orders }))) } };
}
