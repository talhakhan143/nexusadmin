import { db } from "@/server/db";
import type { PaymentEvent } from "./types";

/**
 * Apply a normalized payment event to the order. Idempotent — if the
 * providerEventId has been seen before, returns early.
 */
export async function dispatchPaymentEvent(event: PaymentEvent): Promise<{ applied: boolean; reason?: string }> {
  // Idempotency check via AuditLog
  const dup = await db.auditLog.findFirst({
    where: { entity: "Webhook", entityId: event.providerEventId },
    select: { id: true },
  });
  if (dup) return { applied: false, reason: "duplicate" };

  await db.auditLog.create({
    data: {
      entity: "Webhook",
      entityId: event.providerEventId,
      action: event.rawType,
      diff: JSON.stringify({
        type: event.type,
        orderId: event.orderId,
        ref: event.ref,
        amount: event.amount,
        currency: event.currency,
      }),
    },
  });

  if (!event.orderId) return { applied: false, reason: "no orderId in metadata" };
  const order = await db.order.findUnique({ where: { id: event.orderId } });
  if (!order) return { applied: false, reason: "order not found" };

  switch (event.type) {
    case "payment.succeeded":
      await db.$transaction([
        db.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            paymentRef: event.ref,
            ...(order.status === "PENDING" && { status: "PROCESSING" }),
          },
        }),
        ...(order.status === "PENDING"
          ? [
              db.orderStatusHistory.create({
                data: {
                  orderId: order.id,
                  fromStatus: "PENDING",
                  toStatus: "PROCESSING",
                  note: "Auto: payment succeeded",
                },
              }),
            ]
          : []),
      ]);
      return { applied: true };

    case "payment.failed":
      await db.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED", paymentRef: event.ref },
      });
      return { applied: true };

    case "payment.refunded": {
      const refundAmount = event.amount ?? order.total;
      const existing = await db.refund.findFirst({
        where: { orderId: order.id, gatewayRef: event.providerEventId },
      });
      if (existing) return { applied: false, reason: "refund already recorded" };

      const totalAlready = (
        await db.refund.aggregate({
          where: { orderId: order.id, status: "COMPLETED" },
          _sum: { amount: true },
        })
      )._sum.amount ?? 0;

      const newTotal = totalAlready + refundAmount;
      const paymentStatus = newTotal >= order.total ? "REFUNDED" : "PARTIALLY_REFUNDED";

      await db.$transaction([
        db.refund.create({
          data: {
            orderId: order.id,
            amount: refundAmount,
            status: "COMPLETED",
            gatewayRef: event.providerEventId,
            reason: "Gateway refund",
          },
        }),
        db.order.update({
          where: { id: order.id },
          data: {
            paymentStatus,
            ...(paymentStatus === "REFUNDED" && { status: "REFUNDED" }),
          },
        }),
      ]);
      return { applied: true };
    }

    default:
      return { applied: false, reason: "unhandled event" };
  }
}
