"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface Slice {
  status: string;
  count: number;
}

const COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  PROCESSING: "#64748b",
  SHIPPED: "hsl(var(--primary))",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
  REFUNDED: "#dc2626",
};

export function StatusDistributionPie({ data }: { data: Slice[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-12">No orders in this range.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={50}
          paddingAngle={2}
          stroke="hsl(var(--background))"
        >
          {data.map((s) => (
            <Cell key={s.status} fill={COLORS[s.status] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            borderColor: "hsl(var(--border))",
            borderRadius: 6,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
