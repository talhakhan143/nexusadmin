import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { verifyApiKey, withRateHeaders } from "@/server/api-auth";

/**
 * GET /api/public/v1/orders/:orderNumber
 * Auth: Bearer <api_key>  ·  Scope: orders:read
 *
 * Returns order details for a customer-facing tracking page.
 * Gated by `?email=<customer-email>` to avoid order-number scanning attacks.
 */
export async function GET(req: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const ctx = await verifyApiKey(req, "orders:read");
  if (ctx instanceof Response) return ctx;

  const { orderNumber } = await params;
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "?email=… required (customer verification)" }, { status: 400 });
  }

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: {
      customer: { select: { email: true, name: true } },
      items: true,
      shippingAddress: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order || order.customer?.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return withRateHeaders(
    NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      currency: order.currency,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      shippingAmount: order.shippingAmount,
      discountAmount: order.discountAmount,
      total: order.total,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      placedAt: order.createdAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      items: order.items.map((it) => {
        let snap: { name?: string; variantName?: string; sku?: string } = {};
        try { snap = JSON.parse(it.productSnapshot); } catch {}
        return {
          name: snap.name,
          variant: snap.variantName,
          sku: snap.sku,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.total,
        };
      }),
      shippingAddress: order.shippingAddress,
      timeline: order.statusHistory.map((h) => ({
        status: h.toStatus,
        at: h.createdAt,
        note: h.note,
      })),
    }),
    ctx
  );
}
