"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Row {
  name: string;
  revenue: number;
  units: number;
}

export function TopProductsBar({ data }: { data: Row[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-12">No product sales in this range.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 48)}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis
          type="number"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <YAxis
          dataKey="name"
          type="category"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={150}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            borderColor: "hsl(var(--border))",
            borderRadius: 6,
            fontSize: 12,
          }}
          formatter={(v: number, n: string) => [n === "revenue" ? `$${v.toLocaleString()}` : v.toLocaleString(), n === "revenue" ? "Revenue" : "Units"]}
        />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
