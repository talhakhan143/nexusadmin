"use client";

import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { THEME_PRESETS } from "@/config/theme-presets";
import { useThemePreset } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ColorPicker() {
  const { presetId, setPreset } = useThemePreset();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Choose color preset">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium">Theme color</h4>
            <p className="text-xs text-muted-foreground">Customize the primary accent.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setPreset(preset.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md border p-2 hover:bg-accent transition",
                  presetId === preset.id && "border-primary ring-2 ring-primary/30"
                )}
              >
                <span
                  className="h-6 w-6 rounded-full ring-1 ring-inset ring-black/10 flex items-center justify-center"
                  style={{ backgroundColor: preset.swatch }}
                >
                  {presetId === preset.id && <Check className="h-3.5 w-3.5 text-white" />}
                </span>
                <span className="text-xs">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
