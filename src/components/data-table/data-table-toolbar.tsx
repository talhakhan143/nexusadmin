"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { Settings2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

interface ToolbarProps<TData> {
  table: Table<TData>;
  searchableColumn?: string;
  searchPlaceholder?: string;
  right?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  searchableColumn,
  searchPlaceholder,
  right,
}: ToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {searchableColumn && (
        <Input
          placeholder={searchPlaceholder ?? "Search…"}
          value={(table.getColumn(searchableColumn)?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn(searchableColumn)?.setFilterValue(e.target.value)}
          className="h-9 max-w-xs"
        />
      )}
      {isFiltered && (
        <Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()}>
          Reset <X className="ml-1 h-3.5 w-3.5" />
        </Button>
      )}

      <div className="ml-auto flex items-center gap-2">
        {right}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Settings2 className="mr-2 h-4 w-4" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((c) => c.getCanHide())
              .map((column) => (
                <DropdownMenuItem
                  key={column.id}
                  className="capitalize"
                  onSelect={(e) => {
                    e.preventDefault();
                    column.toggleVisibility(!column.getIsVisible());
                  }}
                >
                  <Checkbox checked={column.getIsVisible()} className="mr-2" />
                  {column.id}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
