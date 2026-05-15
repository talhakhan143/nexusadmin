import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Truck,
  Receipt,
  RotateCcw,
  Mail,
  Phone,
  Package,
} from "lucide-react";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { can } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/modules/order-status-badge";
import { OrderTimeline } from "@/components/modules/order-timeline";
import { AddressCard } from "@/components/modules/address-card";
import { StatusUpdater, TrackingUpdater } from "@/components/modules/status-updater";
import { RefundDialog } from "@/components/modules/refund-dialog";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Order detail" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const canWrite = can(session?.user?.role, "orders:write");
  const canRefund = can(session?.user?.role, "orders:refund");

  const order = await db.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      billingAddress: true,
      shippingAddress: true,
      coupon: true,
      refunds: {
        orderBy: { createdAt: "desc" },
        include: { processedBy: { select: { name: true, email: true } } },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { name: true, email: true } } },
      },
    },
  });
  if (!order) notFound();

  const refundedTotal = order.refunds.filter((r) => r.status === "COMPLETED").reduce((s, r) => s + r.amount, 0);
  const refundable = Math.max(0, order.total - refundedTotal);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Order</p>
            <h1 className="text-xl font-semibold font-mono">{order.orderNumber}</h1>
          </div>
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/orders/${order.id}/invoice`} target="_blank">
              <Receipt className="mr-2 h-4 w-4" /> Invoice
            </Link>
          </Button>
          {canWrite && (
            <StatusUpdater
              orderId={order.id}
              current={order.status}
              trigger={
                <Button>
                  <Edit className="mr-2 h-4 w-4" /> Update status
                </Button>
              }
            />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left column — items, addresses, totals */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Items ({order.items.length})</span>
                <span className="text-sm text-muted-foreground font-normal">{formatDateTime(order.createdAt)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {order.items.map((it) => {
                  let snap: { name?: string; variantName?: string; sku?: string } = {};
                  try { snap = JSON.parse(it.productSnapshot); } catch {}
                  return (
                    <div key={it.id} className="flex items-center justify-between p-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="grid h-10 w-10 place-items-center rounded-md bg-muted shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{snap.name ?? "Product"}</p>
                          <p className="text-xs text-muted-foreground">
                            {snap.variantName && `${snap.variantName} · `}
                            {snap.sku && `SKU: ${snap.sku} · `}
                            Qty: {it.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm shrink-0">
                        <p className="font-mono">{formatCurrency(it.total, order.currency)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(it.unitPrice, order.currency)} × {it.quantity}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Separator />
              <div className="p-4 space-y-1.5 text-sm">
                <Row label="Subtotal" value={formatCurrency(order.subtotal, order.currency)} />
                {order.discountAmount > 0 && (
                  <Row label={`Discount${order.coupon ? ` (${order.coupon.code})` : ""}`} value={`− ${formatCurrency(order.discountAmount, order.currency)}`} />
                )}
                <Row label={`Tax`} value={formatCurrency(order.taxAmount, order.currency)} />
                <Row label="Shipping" value={formatCurrency(order.shippingAmount, order.currency)} />
                <Separator className="my-2" />
                <Row label="Total" value={formatCurrency(order.total, order.currency)} bold />
                {refundedTotal > 0 && (
                  <Row label="Refunded" value={`− ${formatCurrency(refundedTotal, order.currency)}`} className="text-destructive" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
              <CardDescription>
                {order.trackingNumber ? `Tracking: ${order.trackingNumber}` : "No tracking number yet."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.trackingNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{order.trackingNumber}</span>
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Track →
                    </a>
                  )}
                </div>
              )}
              {canWrite && (
                <TrackingUpdater
                  orderId={order.id}
                  current={order.trackingNumber}
                  currentUrl={order.trackingUrl}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Truck className="mr-2 h-4 w-4" /> {order.trackingNumber ? "Update" : "Add"} tracking
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Addresses</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
              <AddressCard title="Shipping" address={order.shippingAddress} />
              <AddressCard title="Billing" address={order.billingAddress} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Refunds</CardTitle>
              <CardDescription>
                Refundable: <strong>{formatCurrency(refundable, order.currency)}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.refunds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No refunds yet.</p>
              ) : (
                <ul className="space-y-2">
                  {order.refunds.map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-sm rounded-md border p-2.5">
                      <div>
                        <p className="font-medium">{formatCurrency(r.amount, order.currency)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(r.createdAt)}
                          {r.processedBy && ` · ${r.processedBy.name ?? r.processedBy.email}`}
                        </p>
                        {r.reason && <p className="text-xs italic">"{r.reason}"</p>}
                      </div>
                      <Badge variant={r.status === "COMPLETED" ? "success" : r.status === "FAILED" ? "destructive" : "warning"}>
                        {r.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
              {canRefund && refundable > 0 && (
                <RefundDialog
                  orderId={order.id}
                  refundable={refundable}
                  currency={order.currency}
                  trigger={
                    <Button variant="outline" size="sm">
                      <RotateCcw className="mr-2 h-4 w-4" /> Process refund
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — customer + payment + timeline */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.customer ? (
                <>
                  <p className="font-medium">{order.customer.name ?? order.customer.email}</p>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="h-3 w-3" /> {order.customer.email}
                  </p>
                  {order.customer.phone && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {order.customer.phone}
                    </p>
                  )}
                  <Separator className="my-2" />
                  <p className="text-xs text-muted-foreground">
                    {order.customer.ordersCount} order{order.customer.ordersCount === 1 ? "" : "s"} · LTV{" "}
                    <strong className="text-foreground">{formatCurrency(order.customer.totalSpent, order.currency)}</strong>
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Guest checkout</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Method" value={order.paymentMethod ?? "—"} />
              <Row label="Status" value={<PaymentStatusBadge status={order.paymentStatus} />} />
              {order.paymentRef && <Row label="Ref" value={<span className="font-mono text-xs">{order.paymentRef}</span>} />}
              {order.coupon && <Row label="Coupon" value={<span className="font-mono">{order.coupon.code}</span>} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline entries={order.statusHistory} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  className,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
