"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { requirePermission } from "@/lib/rbac";
import { dispatchPaymentEvent } from "@/server/payments/dispatcher";
import { randomBytes } from "crypto";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

/**
 * Recompute paymentStatus + status for one or all orders from the refunds aggregate.
 * Useful for fixing drift between webhook events and recorded state.
 */
export async function reconcilePayments(orderId?: string): Promise<ActionResult<{ updated: number }>> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
    return { ok: false, error: "Forbidden" };
  }

  const where = orderId ? { id: orderId } : {};
  const orders = await db.order.findMany({ where, include: { refunds: true } });
  let updated = 0;
  for (const o of orders) {
    const completed = o.refunds.filter((r) => r.status === "COMPLETED").reduce((s, r) => s + r.amount, 0);
    let next: typeof o.paymentStatus = o.paymentStatus;
    if (completed === 0 && o.paymentStatus === "PARTIALLY_REFUNDED") next = "PAID";
    if (completed > 0 && completed < o.total) next = "PARTIALLY_REFUNDED";
    if (completed >= o.total && o.total > 0) next = "REFUNDED";
    if (next !== o.paymentStatus) {
      await db.order.update({ where: { id: o.id }, data: { paymentStatus: next } });
      updated++;
    }
  }
  revalidatePath("/payments");
  return { ok: true, data: { updated } };
}

/**
 * Dev-only: simulate a webhook event end-to-end (no real Stripe needed).
 * Useful for QA and the `/payments` UI demo.
 */
export async function simulateWebhook(
  orderId: string,
  type: "payment.succeeded" | "payment.failed" | "payment.refunded",
  amount?: number
): Promise<ActionResult<{ applied: boolean; reason?: string }>> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") return { ok: false, error: "Super admin only" };

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Order not found" };

  const result = await dispatchPaymentEvent({
    type,
    orderId,
    ref: order.paymentRef ?? `simulated_pi_${randomBytes(8).toString("hex")}`,
    amount: amount ?? order.total,
    currency: order.currency,
    providerEventId: `evt_simulated_${randomBytes(12).toString("hex")}`,
    rawType: `simulated.${type}`,
  });
  revalidatePath("/payments");
  revalidatePath("/orders");
  return { ok: true, data: result };
}
