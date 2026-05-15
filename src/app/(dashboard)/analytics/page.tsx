import { DollarSign, ShoppingCart, Users, TrendingUp, RotateCcw, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/modules/page-header";
import { OrdersRevenueChart } from "@/components/charts/orders-revenue-chart";
import { TopProductsBar } from "@/components/charts/top-products-bar";
import { CustomerGrowthChart } from "@/components/charts/customer-growth-chart";
import { StatusDistributionPie } from "@/components/charts/status-pie";
import { RangeFilter } from "./range-filter";
import { ExportButton } from "./export-button";
import {
  getRevenueSeries,
  getKpiSummary,
  getTopProducts,
  getTopCategories,
  getOrderStatusDistribution,
  getCustomerGrowth,
} from "@/server/actions/analytics";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;

  const [series, kpi, topProducts, topCategories, statusDist, growth] = await Promise.all([
    getRevenueSeries(from, to),
    getKpiSummary(from, to),
    getTopProducts(from, to, 5),
    getTopCategories(from, to, 5),
    getOrderStatusDistribution(from, to),
    getCustomerGrowth(from, to),
  ]);

  return (
    <>
      <PageHeader title="Analytics" description="Revenue, products, customers and conversion insights.">
        <RangeFilter from={from ?? ""} to={to ?? ""} />
        <ExportButton from={from} to={to} />
      </PageHeader>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
        <Kpi icon={DollarSign} label="Gross revenue" value={formatCurrency(kpi.grossRevenue)} />
        <Kpi icon={DollarSign} label="Net revenue" value={formatCurrency(kpi.netRevenue)} accent />
        <Kpi icon={RotateCcw} label="Refunded" value={formatCurrency(kpi.refunded)} />
        <Kpi icon={ShoppingCart} label="Paid orders" value={kpi.paidOrders.toString()} sub={`${kpi.totalOrders} total`} />
        <Kpi icon={Receipt} label="AOV" value={formatCurrency(kpi.aov)} />
        <Kpi icon={Users} label="New customers" value={kpi.newCustomers.toString()} sub={`${kpi.conversion.toFixed(1)}% conversion`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & orders</CardTitle>
            <CardDescription>Daily series across the selected range.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersRevenueChart data={series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order status</CardTitle>
            <CardDescription>Distribution of all orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDistributionPie data={statusDist} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>By revenue (PAID + PARTIALLY_REFUNDED).</CardDescription>
          </CardHeader>
          <CardContent>
            <TopProductsBar data={topProducts.map((p) => ({ name: p.name, revenue: p.revenue, units: p.units }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top categories</CardTitle>
            <CardDescription>By revenue contribution.</CardDescription>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No category data.</p>
            ) : (
              <ul className="space-y-3">
                {topCategories.map((c, i) => {
                  const max = topCategories[0].revenue || 1;
                  const pct = (c.revenue / max) * 100;
                  return (
                    <li key={c.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-muted-foreground w-4">#{i + 1}</span>
                          <span className="font-medium truncate">{c.name}</span>
                          <Badge variant="outline" className="text-[10px]">{c.units} units</Badge>
                        </div>
                        <span className="font-mono">{formatCurrency(Math.round(c.revenue * 100))}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Customer growth</CardTitle>
          <CardDescription>New + cumulative across the range.</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerGrowthChart data={growth} />
        </CardContent>
      </Card>
    </>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className={`mt-2 text-xl font-semibold tracking-tight ${accent ? "text-primary" : ""}`}>{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
