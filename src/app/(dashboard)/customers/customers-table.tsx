"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Download, Mail } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { exportCustomersCsv } from "@/server/actions/customers";
import { formatCurrency } from "@/lib/utils";

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: string;
  totalSpentRaw: number;
  acceptsMarketing: boolean;
  addresses: number;
  createdAt: string;
}

const SEGMENTS: { label: string; value: "all" | "new" | "repeat" | "vip" | "marketing" }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Repeat", value: "repeat" },
  { label: "VIP", value: "vip" },
  { label: "Marketing opt-in", value: "marketing" },
];

interface Props {
  data: CustomerRow[];
  currentSegment: "all" | "new" | "repeat" | "vip" | "marketing";
  currentQuery: string;
  vipThreshold: number;
}

export function CustomersTable({ data, currentSegment, vipThreshold }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function setSegment(seg: typeof currentSegment) {
    const next = new URLSearchParams(params.toString());
    if (seg === "all") next.delete("segment");
    else next.set("segment", seg);
    next.delete("page");
    router.push(`/customers?${next.toString()}`);
  }

  async function onExport() {
    const res = await exportCustomersCsv();
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const blob = new Blob([res.data?.csv ?? ""], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${res.data?.count ?? 0} customers`);
  }

  const columns: ColumnDef<CustomerRow>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => {
        const c = row.original;
        const initials = (c.name !== "—" ? c.name : c.email)
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Link href={`/customers/${c.id}`} className="font-medium hover:underline">
                {c.name}
              </Link>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> {c.email}
              </p>
            </div>
          </div>
        );
      },
    },
    { accessorKey: "phone", header: "Phone" },
    {
      accessorKey: "ordersCount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Orders" />,
    },
    {
      accessorKey: "totalSpent",
      header: ({ column }) => <DataTableColumnHeader column={column} title="LTV" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono">{row.original.totalSpent}</span>
          {row.original.totalSpentRaw >= vipThreshold && <Badge variant="warning">VIP</Badge>}
        </div>
      ),
    },
    {
      accessorKey: "acceptsMarketing",
      header: "Marketing",
      cell: ({ row }) =>
        row.original.acceptsMarketing ? (
          <Badge variant="success">Opted in</Badge>
        ) : (
          <Badge variant="secondary">No</Badge>
        ),
    },
    { accessorKey: "addresses", header: "Addresses" },
    { accessorKey: "createdAt", header: "Joined" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {SEGMENTS.map((s) => (
          <Button
            key={s.value}
            variant={currentSegment === s.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSegment(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchableColumn="name"
        searchPlaceholder="Search by name, email, phone…"
        emptyMessage="No customers match."
        toolbarRight={
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        }
      />
    </>
  );
}
