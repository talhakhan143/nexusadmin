"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportAnalyticsCsv } from "@/server/actions/analytics";

export function ExportButton({ from, to }: { from?: string; to?: string }) {
  async function onExport() {
    const res = await exportAnalyticsCsv(from, to);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const blob = new Blob([res.data?.csv ?? ""], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Analytics exported");
  }
  return (
    <Button variant="outline" size="sm" onClick={onExport}>
      <Download className="mr-2 h-4 w-4" /> Export
    </Button>
  );
}
