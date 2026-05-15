import Link from "next/link";
import { CreditCard, CheckCircle2, XCircle, AlertCircle, Webhook, ExternalLink } from "lucide-react";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { can } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/modules/page-header";
import { PaymentStatusBadge } from "@/components/modules/order-status-badge";
import { PaymentsTable } from "./payments-table";
import { stripeProvider } from "@/server/payments/stripe";
import { paypalProvider } from "@/server/payments/paypal";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Payments" };

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : null;
  const method = typeof sp.method === "string" ? sp.method : null;

  const where = {
    ...(status && { paymentStatus: status as any }),
    ...(method && { paymentMethod: method as any }),
  };

  const [orders, refundsAgg, eventLog, kpiAgg] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { customer: { select: { email: true, name: true } } },
    }),
    db.refund.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
      _count: true,
    }),
    db.auditLog.findMany({
      where: { entity: "Webhook" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.order.groupBy({
      by: ["paymentStatus"],
      _count: true,
      _sum: { total: true },
    }),
  ]);

  const stats = Object.fromEntries(
    kpiAgg.map((g) => [g.paymentStatus, { count: g._count, total: g._sum.total ?? 0 }])
  );

  const rows = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customer: o.customer?.name ?? o.customer?.email ?? "Guest",
    method: o.paymentMethod ?? "—",
    paymentStatus: o.paymentStatus,
    paymentRef: o.paymentRef ?? null,
    total: o.total,
    currency: o.currency,
    createdAt: o.createdAt,
    canSimulate: isSuperAdmin,
  }));

  return (
    <>
      <PageHeader title="Payments" description="Transactions, refunds, gateway integrations and webhook log." />

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi
          icon={CheckCircle2}
          label="Paid"
          value={formatCurrency(stats.PAID?.total ?? 0)}
          sub={`${stats.PAID?.count ?? 0} transactions`}
          color="text-emerald-500"
        />
        <Kpi
          icon={AlertCircle}
          label="Pending"
          value={formatCurrency(stats.PENDING?.total ?? 0)}
          sub={`${stats.PENDING?.count ?? 0} transactions`}
          color="text-amber-500"
        />
        <Kpi
          icon={XCircle}
          label="Failed"
          value={formatCurrency(stats.FAILED?.total ?? 0)}
          sub={`${stats.FAILED?.count ?? 0} transactions`}
          color="text-destructive"
        />
        <Kpi
          icon={CreditCard}
          label="Refunded"
          value={formatCurrency(refundsAgg._sum.amount ?? 0)}
          sub={`${refundsAgg._count} refunds processed`}
          color="text-destructive"
        />
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">
            <CreditCard className="mr-2 h-4 w-4" /> Transactions
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="mr-2 h-4 w-4" /> Webhook log ({eventLog.length})
          </TabsTrigger>
          <TabsTrigger value="gateways">Gateways</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <PaymentsTable
            data={rows}
            currentStatus={status}
            currentMethod={method}
          />
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Recent webhook events</CardTitle>
              <CardDescription>
                Idempotent: each provider event is recorded once with its raw payload.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {eventLog.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  No webhook events yet. Simulate one from a transaction row.
                </p>
              ) : (
                <div className="divide-y">
                  {eventLog.map((e) => {
                    let payload: Record<string, unknown> = {};
                    try { payload = JSON.parse((e.diff as string) ?? "{}"); } catch {}
                    return (
                      <div key={e.id} className="p-3 flex items-start gap-3">
                        <Webhook className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="text-sm font-medium font-mono">{e.action}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</p>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono truncate">{e.entityId}</p>
                          {payload.orderId ? (
                            <Link
                              href={`/orders/${payload.orderId}`}
                              className="text-xs text-primary hover:underline mt-0.5 inline-flex items-center gap-1"
                            >
                              Order {String(payload.orderId).slice(-8)} <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gateways">
          <div className="grid gap-4 sm:grid-cols-2">
            <GatewayCard
              name="Stripe"
              configured={stripeProvider.isConfigured()}
              description="Cards, Apple Pay, Google Pay. Webhook endpoint: /api/webhooks/stripe"
              docsUrl="https://stripe.com/docs/webhooks"
            />
            <GatewayCard
              name="PayPal"
              configured={paypalProvider.isConfigured()}
              description="Adapter scaffolded — wire in PayPal Orders v2 API via PAYPAL_CLIENT_ID/SECRET env."
              docsUrl="https://developer.paypal.com/docs/api/orders/v2/"
            />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <Icon className={`h-3.5 w-3.5 ${color}`} />
        </div>
        <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function GatewayCard({
  name,
  configured,
  description,
  docsUrl,
}: {
  name: string;
  configured: boolean;
  description: string;
  docsUrl: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{name}</CardTitle>
          {configured ? (
            <Badge variant="success">Connected</Badge>
          ) : (
            <Badge variant="secondary">Not configured</Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <a
          href={docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          Docs <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </CardContent>
    </Card>
  );
}
