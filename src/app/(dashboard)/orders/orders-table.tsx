"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/modules/order-status-badge";
import { exportOrdersCsv } from "@/server/actions/orders";

export interface OrderRow {
  id: string;
  orderNumber: string;
  customer: string;
  customerEmail: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: number;
  total: string;
  createdAt: string;
}

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"];

interface Props {
  data: OrderRow[];
  currentStatus: OrderStatus | null;
  currentPaymentStatus: PaymentStatus | null;
  currentFrom: string;
  currentTo: string;
  currentQuery: string;
}

export function OrdersTable({ data, currentStatus, currentPaymentStatus, currentFrom, currentTo }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function pushParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`/orders?${next.toString()}`);
  }

  async function onExport() {
    const res = await exportOrdersCsv();
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const blob = new Blob([res.data?.csv ?? ""], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${res.data?.count ?? 0} orders`);
  }

  const columns: ColumnDef<OrderRow>[] = [
    {
      accessorKey: "orderNumber",
      header: "Order",
      cell: ({ row }) => (
        <Link href={`/orders/${row.original.id}`} className="font-mono text-sm hover:underline">
          {row.original.orderNumber}
        </Link>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.customer}</p>
          {row.original.customerEmail && row.original.customerEmail !== row.original.customer && (
            <p className="text-xs text-muted-foreground">{row.original.customerEmail}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => <PaymentStatusBadge status={row.original.paymentStatus} />,
    },
    { accessorKey: "items", header: "Items" },
    { accessorKey: "total", header: "Total" },
    { accessorKey: "createdAt", header: "Date" },
  ];

  return (
    <>
      {/* Filter row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={currentStatus ?? "__all__"} onValueChange={(v) => pushParam("status", v === "__all__" ? null : v)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Payment</Label>
          <Select
            value={currentPaymentStatus ?? "__all__"}
            onValueChange={(v) => pushParam("paymentStatus", v === "__all__" ? null : v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All payments</SelectItem>
              {PAYMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" value={currentFrom} onChange={(e) => pushParam("from", e.target.value || null)} className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" value={currentTo} onChange={(e) => pushParam("to", e.target.value || null)} className="h-9" />
        </div>
        <div className="space-y-1 flex flex-col justify-end">
          {(currentStatus || currentPaymentStatus || currentFrom || currentTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/orders")}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchableColumn="orderNumber"
        searchPlaceholder="Search order # or customer…"
        emptyMessage="No orders match these filters."
        toolbarRight={
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        }
      />
    </>
  );
}
