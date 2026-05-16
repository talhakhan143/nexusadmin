import Link from "next/link";
import { Package, Truck, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { fetchOrderAction } from "@/server/actions";
import { formatPKR } from "@/lib/currency";
import { cn } from "@/lib/cn";

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  PENDING: Clock,
  PROCESSING: Package,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
  CANCELLED: XCircle,
  REFUNDED: AlertCircle,
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-stone-100 text-stone-800",
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { orderNumber } = await params;
  const sp = await searchParams;

  if (!sp.email) {
    return (
      <NotFoundOrUnauth message="Email verification required. Please use the link from your confirmation email." />
    );
  }

  const res = await fetchOrderAction(orderNumber, sp.email);
  if (!res.ok) {
    return <NotFoundOrUnauth message={res.error} />;
  }

  const order = res.data;
  const StatusIcon = STATUS_ICON[order.status] ?? Clock;

  return (
    <div className="container-tight py-12 md:py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Order</p>
          <h1 className="font-serif text-3xl md:text-4xl mt-1">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Placed on {new Date(order.placedAt).toLocaleDateString("en-PK", { dateStyle: "long" })}
          </p>
        </div>
        <Badge className={cn("text-sm px-3 py-1.5", STATUS_COLOR[order.status])}>
          {order.status}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-10">
        {/* Timeline */}
        <div className="space-y-8">
          <section className="bg-secondary/40 border p-6">
            <h2 className="font-serif text-xl mb-5">Order status</h2>
            <ol className="space-y-5">
              {order.timeline.map((step, i) => {
                const Icon = STATUS_ICON[step.status] ?? StatusIcon;
                return (
                  <li key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="p-2 rounded-full bg-background border-2 border-accent">
                        <Icon className="h-4 w-4 text-accent" />
                      </div>
                      {i < order.timeline.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="font-medium text-sm">{step.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(step.at).toLocaleString("en-PK")}
                      </p>
                      {step.note && <p className="text-xs mt-1">{step.note}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
            {order.trackingNumber && (
              <div className="mt-5 pt-5 border-t flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Tracking number</p>
                  <p className="font-mono text-sm mt-1">{order.trackingNumber}</p>
                </div>
                {order.trackingUrl && (
                  <Button asChild size="sm" variant="outline">
                    <a href={order.trackingUrl} target="_blank" rel="noopener">Track shipment</a>
                  </Button>
                )}
              </div>
            )}
          </section>

          {/* Items */}
          <section>
            <h2 className="font-serif text-xl mb-5">Items ({order.items.length})</h2>
            <div className="space-y-3">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between gap-4 py-3 border-b">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{it.name}</p>
                    {it.variant && <p className="text-xs text-muted-foreground">{it.variant}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Qty {it.quantity} × {formatPKR(it.unitPrice)}</p>
                  </div>
                  <p className="font-medium text-sm">{formatPKR(it.total)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Address */}
          <section>
            <h2 className="font-serif text-xl mb-3">Shipping address</h2>
            <address className="not-italic text-sm space-y-1 text-muted-foreground">
              <p className="text-foreground font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
              {order.shippingAddress.state && <p>{order.shippingAddress.state}</p>}
              <p>{order.shippingAddress.country}</p>
            </address>
          </section>
        </div>

        {/* Summary */}
        <aside>
          <div className="bg-secondary/40 border p-6 space-y-3">
            <h3 className="font-serif text-xl">Payment summary</h3>
            <Row label="Subtotal" value={formatPKR(order.subtotal)} />
            <Row label="Shipping" value={order.shippingAmount === 0 ? "Free" : formatPKR(order.shippingAmount)} />
            {order.discountAmount > 0 && <Row label="Discount" value={`- ${formatPKR(order.discountAmount)}`} />}
            {order.taxAmount > 0 && <Row label="Tax" value={formatPKR(order.taxAmount)} />}
            <Separator />
            <div className="flex justify-between font-serif text-lg">
              <span>Total</span>
              <span>{formatPKR(order.total)}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Payment status: <Badge variant="soft">{order.paymentStatus}</Badge>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Need help with this order?</p>
            <Button asChild variant="outline">
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function NotFoundOrUnauth({ message }: { message: string }) {
  return (
    <div className="container-tight py-20 text-center max-w-md mx-auto">
      <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
      <h1 className="font-serif text-2xl">Order not found</h1>
      <p className="mt-3 text-muted-foreground text-sm">{message}</p>
      <Button asChild className="mt-6">
        <Link href="/order">Try again</Link>
      </Button>
    </div>
  );
}
