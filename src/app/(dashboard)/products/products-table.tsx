"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { MoreHorizontal, Trash2, Copy, Archive, Download } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteProduct,
  duplicateProduct,
  archiveProducts,
  exportProductsCsv,
} from "@/server/actions/products";

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  price: string;
  stock: number;
  variants: number;
  createdAt: string;
}

const STATUS_VARIANT: Record<ProductRow["status"], "success" | "secondary" | "warning"> = {
  ACTIVE: "success",
  DRAFT: "warning",
  ARCHIVED: "secondary",
};

const STATUS_FILTERS: { label: string; value: ProductRow["status"] | null }[] = [
  { label: "All", value: null },
  { label: "Active", value: "ACTIVE" },
  { label: "Draft", value: "DRAFT" },
  { label: "Archived", value: "ARCHIVED" },
];

interface Props {
  data: ProductRow[];
  total: number;
  currentStatus: ProductRow["status"] | null;
  currentQuery: string;
  canWrite: boolean;
}

export function ProductsTable({ data, currentStatus, canWrite }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pendingDelete, setPendingDelete] = React.useState<ProductRow | null>(null);

  function setStatus(status: ProductRow["status"] | null) {
    const next = new URLSearchParams(params.toString());
    if (status) next.set("status", status);
    else next.delete("status");
    next.delete("page");
    router.push(`/products?${next.toString()}`);
  }

  async function onExport() {
    const res = await exportProductsCsv();
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const csv = res.data?.csv ?? "";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${res.data?.count ?? 0} products`);
  }

  async function onConfirmDelete() {
    if (!pendingDelete) return;
    const res = await deleteProduct(pendingDelete.id);
    setPendingDelete(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Product deleted");
    router.refresh();
  }

  async function onDuplicate(id: string) {
    const res = await duplicateProduct(id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Duplicated");
    router.refresh();
  }

  const columns: ColumnDef<ProductRow>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          <Link href={`/products/${row.original.id}`} className="font-medium hover:underline">
            {row.original.name}
          </Link>
          <p className="text-xs text-muted-foreground">SKU: {row.original.sku}</p>
        </div>
      ),
    },
    { accessorKey: "category", header: "Category" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge>,
    },
    { accessorKey: "price", header: "Price" },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => (
        <span className={row.original.stock <= 5 ? "text-amber-600 font-medium" : ""}>{row.original.stock}</span>
      ),
    },
    { accessorKey: "variants", header: "Variants" },
    { accessorKey: "createdAt", header: "Created" },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/products/${row.original.id}`}>Edit</Link>
            </DropdownMenuItem>
            {canWrite && (
              <DropdownMenuItem onClick={() => onDuplicate(row.original.id)}>
                <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
              </DropdownMenuItem>
            )}
            {canWrite && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setPendingDelete(row.original)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      {/* Status filter chips */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {STATUS_FILTERS.map((f) => {
          const active = currentStatus === f.value;
          return (
            <Button
              key={f.label}
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus(f.value)}
            >
              {f.label}
            </Button>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchableColumn="name"
        searchPlaceholder="Search products…"
        emptyMessage={data.length === 0 ? "No products match." : undefined}
        toolbarRight={
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{pendingDelete?.name}</strong>, its variants, images, and tag links.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
