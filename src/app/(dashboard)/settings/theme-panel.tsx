"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { THEME_PRESETS } from "@/config/theme-presets";
import { useThemePreset } from "@/components/layout/theme-provider";
import { setDefaultTheme } from "@/server/actions/settings";
import { cn } from "@/lib/utils";

export function ThemePanel({ defaultPreset }: { defaultPreset: string }) {
  const router = useRouter();
  const { presetId, setPreset } = useThemePreset();
  const [savingId, setSavingId] = React.useState<string | null>(null);

  async function makeDefault(id: string) {
    setSavingId(id);
    const res = await setDefaultTheme(id);
    setSavingId(null);
    if (!res.ok) toast.error(res.error);
    else {
      toast.success(`Default theme set to ${id}`);
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme presets</CardTitle>
        <CardDescription>
          Click a preset to preview live. "Make default" saves it as the store-wide initial theme.
          Current default: <code className="text-xs">{defaultPreset}</code>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {THEME_PRESETS.map((p) => {
          const active = presetId === p.id;
          const isDefault = defaultPreset === p.id;
          return (
            <div key={p.id} className={cn("rounded-md border p-3 space-y-2", active && "border-primary ring-2 ring-primary/30")}>
              <button
                type="button"
                onClick={() => setPreset(p.id)}
                className="w-full flex flex-col items-center gap-2"
              >
                <span
                  className="grid h-10 w-10 place-items-center rounded-full ring-1 ring-inset ring-black/10"
                  style={{ backgroundColor: p.swatch }}
                >
                  {active && <Check className="h-4 w-4 text-white" />}
                </span>
                <span className="text-sm font-medium">{p.name}</span>
              </button>
              {isDefault ? (
                <p className="text-[11px] text-center text-emerald-500 font-medium">Default</p>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-[11px]"
                  onClick={() => makeDefault(p.id)}
                  disabled={savingId === p.id}
                >
                  {savingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Make default"}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
