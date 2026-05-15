"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Zap, Play, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { PaymentStatus, PaymentMethod } from "@prisma/client";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaymentStatusBadge } from "@/components/modules/order-status-badge";
import { simulateWebhook } from "@/server/actions/payments";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export interface PaymentRow {
  id: string;
  orderNumber: string;
  customer: string;
  method: string;
  paymentStatus: PaymentStatus;
  paymentRef: string | null;
  total: number;
  currency: string;
  createdAt: Date | string;
  canSimulate: boolean;
}

const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"];
const PAYMENT_METHODS: PaymentMethod[] = ["STRIPE", "PAYPAL", "COD", "BANK_TRANSFER", "OTHER"];

interface Props {
  data: PaymentRow[];
  currentStatus: string | null;
  currentMethod: string | null;
}

export function PaymentsTable({ data, currentStatus, currentMethod }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "__all__") next.set(key, value);
    else next.delete(key);
    router.push(`/payments?${next.toString()}`);
  }

  async function simulate(orderId: string, type: "payment.succeeded" | "payment.failed" | "payment.refunded") {
    const res = await simulateWebhook(orderId, type);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    if (!res.data?.applied) {
      toast.warning(`Skipped: ${res.data?.reason ?? "no change"}`);
      return;
    }
    toast.success(`Webhook applied: ${type}`);
    router.refresh();
  }

  const columns: ColumnDef<PaymentRow>[] = [
    {
      accessorKey: "orderNumber",
      header: "Order",
      cell: ({ row }) => (
        <Link href={`/orders/${row.original.id}`} className="font-mono text-sm hover:underline">
          {row.original.orderNumber}
        </Link>
      ),
    },
    { accessorKey: "customer", header: "Customer" },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => <span className="text-sm">{row.original.method}</span>,
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: ({ row }) => <PaymentStatusBadge status={row.original.paymentStatus} />,
    },
    {
      accessorKey: "paymentRef",
      header: "Ref",
      cell: ({ row }) =>
        row.original.paymentRef ? (
          <span className="font-mono text-xs">{row.original.paymentRef.slice(0, 18)}…</span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      accessorKey: "total",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{formatCurrency(row.original.total, row.original.currency)}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => <span className="text-sm">{formatDateTime(row.original.createdAt)}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) =>
        row.original.canSimulate ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Simulate
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => simulate(row.original.id, "payment.succeeded")}>
                <Play className="mr-2 h-3.5 w-3.5 text-emerald-500" /> payment.succeeded
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => simulate(row.original.id, "payment.failed")}>
                <X className="mr-2 h-3.5 w-3.5 text-destructive" /> payment.failed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => simulate(row.original.id, "payment.refunded")}>
                <RotateCcw className="mr-2 h-3.5 w-3.5 text-destructive" /> payment.refunded
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ];

  return (
    <>
      <div className="grid sm:grid-cols-3 gap-2 mb-3">
        <div className="space-y-1">
          <Label className="text-xs">Payment status</Label>
          <Select value={currentStatus ?? "__all__"} onValueChange={(v) => setParam("status", v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {PAYMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Method</Label>
          <Select value={currentMethod ?? "__all__"} onValueChange={(v) => setParam("method", v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All methods</SelectItem>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>{m.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          {(currentStatus || currentMethod) && (
            <Button variant="ghost" size="sm" onClick={() => router.push("/payments")}>
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
        emptyMessage="No transactions match."
      />
    </>
  );
}
