"use client";

import * as React from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VariantInput } from "@/lib/validations/product";
import {
  currencyConfig,
  toMinor,
  toMajor,
  compareAtFromDiscount,
  discountFromCompareAt,
} from "@/lib/admin-currency";

export interface OptionDef {
  name: string;          // e.g. "Color"
  values: string[];      // e.g. ["Red", "Blue"]
}

interface VariantsEditorProps {
  basePrice: number;     // major units (UI-side)
  variants: VariantInput[];
  onChange: (variants: VariantInput[]) => void;
  currency?: string;
}

/**
 * Combines option definitions to generate a variant matrix, then lets the user
 * tweak per-row price, stock, SKU. Stores prices as integer minor units.
 */
export function VariantsEditor({ basePrice, variants, onChange, currency = "USD" }: VariantsEditorProps) {
  const cfg = currencyConfig(currency);
  const [optionDefs, setOptionDefs] = React.useState<OptionDef[]>(() => {
    // Reconstruct option defs from current variants
    const map = new Map<string, Set<string>>();
    for (const v of variants) {
      for (const o of v.options) {
        if (!map.has(o.name)) map.set(o.name, new Set());
        map.get(o.name)!.add(o.value);
      }
    }
    return Array.from(map.entries()).map(([name, vals]) => ({ name, values: Array.from(vals) }));
  });

  const [newOptName, setNewOptName] = React.useState("");
  const [newOptValue, setNewOptValue] = React.useState<Record<string, string>>({});

  function addOption() {
    const name = newOptName.trim();
    if (!name) return;
    if (optionDefs.find((o) => o.name.toLowerCase() === name.toLowerCase())) return;
    setOptionDefs([...optionDefs, { name, values: [] }]);
    setNewOptName("");
  }

  function removeOption(name: string) {
    setOptionDefs(optionDefs.filter((o) => o.name !== name));
  }

  function addValue(optName: string) {
    const value = (newOptValue[optName] ?? "").trim();
    if (!value) return;
    setOptionDefs(
      optionDefs.map((o) => (o.name === optName && !o.values.includes(value) ? { ...o, values: [...o.values, value] } : o))
    );
    setNewOptValue({ ...newOptValue, [optName]: "" });
  }

  function removeValue(optName: string, value: string) {
    setOptionDefs(
      optionDefs.map((o) => (o.name === optName ? { ...o, values: o.values.filter((v) => v !== value) } : o))
    );
  }

  // Generate or refresh matrix when option defs change
  React.useEffect(() => {
    const filledDefs = optionDefs.filter((o) => o.values.length > 0);
    if (filledDefs.length === 0) {
      // Single default variant
      if (variants.length === 0 || variants.some((v) => v.options.length > 0)) {
        onChange([
          {
            name: "Default",
            price: toMinor(basePrice, currency),
            stock: 0,
            lowStockThreshold: 5,
            position: 0,
            options: [],
          },
        ]);
      }
      return;
    }
    // Cartesian product
    const combos: { name: string; value: string }[][] = filledDefs.reduce<{ name: string; value: string }[][]>(
      (acc, def) => {
        if (acc.length === 0) return def.values.map((v) => [{ name: def.name, value: v }]);
        const next: { name: string; value: string }[][] = [];
        for (const a of acc) for (const v of def.values) next.push([...a, { name: def.name, value: v }]);
        return next;
      },
      []
    );

    // Preserve existing values where possible
    const matched: VariantInput[] = combos.map((opts, i) => {
      const key = opts.map((o) => `${o.name}:${o.value}`).join("|");
      const existing = variants.find(
        (v) => v.options.map((o) => `${o.name}:${o.value}`).sort().join("|") === opts.slice().sort((a, b) => a.name.localeCompare(b.name)).map((o) => `${o.name}:${o.value}`).sort().join("|")
      );
      if (existing) return { ...existing, position: i, options: opts };
      return {
        name: opts.map((o) => o.value).join(" / "),
        price: Math.round(basePrice * 100),
        stock: 0,
        lowStockThreshold: 5,
        position: i,
        options: opts,
      };
    });

    onChange(matched);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(optionDefs)]);

  function updateRow(idx: number, patch: Partial<VariantInput>) {
    const next = [...variants];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/30 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Option name (e.g. Color, Size)"
            value={newOptName}
            onChange={(e) => setNewOptName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
            className="h-9"
          />
          <Button type="button" size="sm" onClick={addOption}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add option
          </Button>
        </div>

        {optionDefs.map((opt) => (
          <Card key={opt.name}>
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm">{opt.name}</Label>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeOption(opt.name)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {opt.values.map((v) => (
                  <Badge key={v} variant="secondary" className="gap-1">
                    {v}
                    <button type="button" onClick={() => removeValue(opt.name, v)} aria-label={`Remove ${v}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  value={newOptValue[opt.name] ?? ""}
                  onChange={(e) => setNewOptValue({ ...newOptValue, [opt.name]: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addValue(opt.name))}
                  placeholder="Add value…"
                  className="h-7 w-32 text-xs"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {variants.length > 0 && (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left p-2">Variant</th>
                <th className="text-left p-2 w-28">Price ({cfg.symbol})</th>
                <th className="text-left p-2 w-28">Compare-at ({cfg.symbol})</th>
                <th className="text-left p-2 w-20">Off %</th>
                <th className="text-left p-2 w-20">Stock</th>
                <th className="text-left p-2 w-20">Low @</th>
                <th className="text-left p-2 w-32">SKU</th>
                <th className="text-left p-2 w-20">Status</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, idx) => {
                const compareAt = v.compareAtPrice ?? 0;
                const off = discountFromCompareAt(v.price, compareAt);
                const soldOut = v.stock <= 0;
                return (
                  <tr key={idx} className="border-t">
                    <td className="p-2">
                      <span className="font-medium">{v.name || "—"}</span>
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step={cfg.decimals === 0 ? "1" : "0.01"}
                        min="0"
                        value={toMajor(v.price, currency).toString()}
                        onChange={(e) => updateRow(idx, { price: toMinor(Number(e.target.value || 0), currency) })}
                        className="h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step={cfg.decimals === 0 ? "1" : "0.01"}
                        min="0"
                        placeholder="—"
                        value={compareAt ? toMajor(compareAt, currency).toString() : ""}
                        onChange={(e) =>
                          updateRow(idx, {
                            compareAtPrice: e.target.value ? toMinor(Number(e.target.value), currency) : null,
                          })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="0"
                        max="99"
                        placeholder="0"
                        value={off || ""}
                        onChange={(e) => {
                          const pct = Number(e.target.value || 0);
                          updateRow(idx, {
                            compareAtPrice: pct > 0 && v.price ? compareAtFromDiscount(v.price, pct) : null,
                          });
                        }}
                        className="h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => updateRow(idx, { stock: Number(e.target.value || 0) })}
                        className={`h-8 ${soldOut ? "border-destructive/40 bg-destructive/5" : ""}`}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="0"
                        value={v.lowStockThreshold}
                        onChange={(e) => updateRow(idx, { lowStockThreshold: Number(e.target.value || 0) })}
                        className="h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={v.sku ?? ""}
                        onChange={(e) => updateRow(idx, { sku: e.target.value })}
                        className="h-8 font-mono text-xs"
                      />
                    </td>
                    <td className="p-2">
                      {soldOut ? (
                        <Badge variant="destructive" className="text-[10px]">Sold out</Badge>
                      ) : v.stock <= v.lowStockThreshold ? (
                        <Badge variant="secondary" className="text-[10px]">Low</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">In stock</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="px-3 py-2 text-[11px] text-muted-foreground border-t bg-muted/20">
            Set Stock to <strong>0</strong> to mark a variant as sold out. The storefront will hide its Add-to-cart button automatically.
          </p>
        </div>
      )}
    </div>
  );
}
