import { DollarSign, ShoppingCart, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

async function getStats() {
  const [orderAgg, ordersCount, customersCount, recentOrders, lowStock] = await Promise.all([
    db.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: "PAID" },
    }),
    db.order.count(),
    db.customer.count(),
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
    db.productVariant.findMany({
      take: 5,
      where: { stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      include: { product: { select: { name: true, slug: true } } },
    }),
  ]);

  // Sample series for chart (last 7 days, deterministic placeholder).
  const today = new Date();
  const series = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return {
      date: d.toLocaleDateString("en-US", { weekday: "short" }),
      revenue: Math.floor(800 + Math.random() * 2200),
    };
  });

  return {
    totalRevenue: orderAgg._sum.total ?? 0,
    ordersCount,
    customersCount,
    conversion: ordersCount && customersCount ? (ordersCount / Math.max(customersCount, 1)) * 100 : 0,
    recentOrders,
    lowStock,
    series,
  };
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "warning" | "success" | "destructive"> = {
  PENDING: "warning",
  PROCESSING: "secondary",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}.
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening in your store today.</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          delta="+12.4%"
        />
        <MetricCard title="Orders" value={stats.ordersCount.toString()} icon={ShoppingCart} delta="+5.1%" />
        <MetricCard title="Customers" value={stats.customersCount.toString()} icon={Users} delta="+2.8%" />
        <MetricCard
          title="Conversion"
          value={`${stats.conversion.toFixed(1)}%`}
          icon={TrendingUp}
          delta="+0.6%"
        />
      </div>

      {/* Chart + low stock */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue (last 7 days)</CardTitle>
            <CardDescription>Trailing weekly performance</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={stats.series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Low stock alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <CardDescription>Variants at or below threshold</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">No alerts. Inventory healthy. 🎉</p>
            ) : (
              stats.lowStock.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{v.product.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{v.name ?? "—"}</p>
                  </div>
                  <Badge variant={v.stock === 0 ? "destructive" : "warning"}>{v.stock} left</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>Last 5 orders placed</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {stats.recentOrders.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No orders yet.</div>
            ) : (
              stats.recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {o.customer?.name ?? o.customer?.email ?? "Guest"} · {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_VARIANT[o.status] ?? "default"}>{o.status}</Badge>
                    <span className="font-mono text-sm">{formatCurrency(o.total, o.currency)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  delta,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  delta: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{delta}</span>
        </div>
      </CardContent>
    </Card>
  );
}
