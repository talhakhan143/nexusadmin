"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface TagOption {
  id: string;
  name: string;
}

interface TagsInputProps {
  available: TagOption[];
  value: string[]; // selected tag IDs
  onChange: (ids: string[]) => void;
  onCreate?: (name: string) => Promise<TagOption | null>;
}

export function TagsInput({ available, value, onChange, onCreate }: TagsInputProps) {
  const [input, setInput] = React.useState("");
  const selected = available.filter((t) => value.includes(t.id));
  const suggestions = available.filter(
    (t) => !value.includes(t.id) && (input ? t.name.toLowerCase().includes(input.toLowerCase()) : true)
  );

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }

  async function add() {
    const name = input.trim();
    if (!name) return;
    const existing = available.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!value.includes(existing.id)) onChange([...value, existing.id]);
    } else if (onCreate) {
      const created = await onCreate(name);
      if (created) onChange([...value, created.id]);
    }
    setInput("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {selected.map((t) => (
          <Badge key={t.id} variant="secondary" className="gap-1">
            {t.name}
            <button type="button" onClick={() => toggle(t.id)} aria-label={`Remove ${t.name}`}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Add or search tags…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          className="h-9"
        />
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </div>
      {input && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.slice(0, 8).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className="text-xs rounded-md border bg-background hover:bg-accent px-2 py-1"
            >
              + {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
