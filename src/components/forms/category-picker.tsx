"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
}

interface CategoryPickerProps {
  value?: string | null;
  onChange: (id: string | null) => void;
  categories: CategoryNode[];
  placeholder?: string;
}

export function CategoryPicker({ value, onChange, categories, placeholder = "Select category…" }: CategoryPickerProps) {
  const tree = React.useMemo(() => buildLabeledList(categories), [categories]);

  return (
    <Select
      value={value ?? "__none__"}
      onValueChange={(v) => onChange(v === "__none__" ? null : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">— No category —</SelectItem>
        {tree.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function buildLabeledList(cats: CategoryNode[]): { id: string; label: string }[] {
  const byId = new Map(cats.map((c) => [c.id, c]));
  const childrenOf = new Map<string | null, CategoryNode[]>();
  for (const c of cats) {
    const k = c.parentId ?? null;
    if (!childrenOf.has(k)) childrenOf.set(k, []);
    childrenOf.get(k)!.push(c);
  }
  const out: { id: string; label: string }[] = [];
  function walk(parentId: string | null, depth: number) {
    const kids = (childrenOf.get(parentId) ?? []).sort((a, b) => a.name.localeCompare(b.name));
    for (const k of kids) {
      out.push({ id: k.id, label: `${"— ".repeat(depth)}${k.name}` });
      walk(k.id, depth + 1);
    }
  }
  walk(null, 0);
  return out;
}
