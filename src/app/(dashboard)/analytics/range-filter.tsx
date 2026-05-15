"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "365d", days: 365 },
];

export function RangeFilter({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const [f, setF] = React.useState(from);
  const [t, setT] = React.useState(to);

  function pushRange(fromVal: string, toVal: string) {
    const next = new URLSearchParams();
    if (fromVal) next.set("from", fromVal);
    if (toVal) next.set("to", toVal);
    router.push(`/analytics?${next.toString()}`);
  }

  function applyPreset(days: number) {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - days);
    const fromStr = start.toISOString().slice(0, 10);
    const toStr = today.toISOString().slice(0, 10);
    setF(fromStr);
    setT(toStr);
    pushRange(fromStr, toStr);
  }

  return (
    <div className="flex items-center gap-1.5">
      {PRESETS.map((p) => (
        <Button key={p.label} variant="outline" size="sm" onClick={() => applyPreset(p.days)}>
          {p.label}
        </Button>
      ))}
      <Input type="date" value={f} onChange={(e) => setF(e.target.value)} className="h-9 w-36" />
      <span className="text-muted-foreground text-sm">→</span>
      <Input type="date" value={t} onChange={(e) => setT(e.target.value)} className="h-9 w-36" />
      <Button size="sm" onClick={() => pushRange(f, t)} disabled={!f && !t}>
        Apply
      </Button>
    </div>
  );
}
