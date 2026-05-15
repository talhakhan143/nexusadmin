"use client";

import { Printer } from "lucide-react";

export function PrintTrigger() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-blue-700"
    >
      <Printer className="h-4 w-4" /> Print / Save as PDF
    </button>
  );
}
