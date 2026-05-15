"use client";

import {
  Bar,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  date: string;
  revenue: number;
  orders: number;
}

export function OrdersRevenueChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ left: 5, right: 10, top: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: string) => v.slice(5)}
        />
        <YAxis
          yAxisId="rev"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <YAxis
          yAxisId="orders"
          orientation="right"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            borderColor: "hsl(var(--border))",
            borderRadius: 6,
            fontSize: 12,
          }}
          formatter={(v: number, name: string) => [
            name === "revenue" ? `$${v.toLocaleString()}` : v.toLocaleString(),
            name === "revenue" ? "Revenue" : "Orders",
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="rev" dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Line yAxisId="orders" type="monotone" dataKey="orders" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
