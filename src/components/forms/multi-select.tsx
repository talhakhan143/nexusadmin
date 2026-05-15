"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  id: string;
  label: string;
  hint?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  emptyText?: string;
}

/**
 * Searchable multi-select with chip display. Used for product / category targeting.
 */
export function MultiSelect({ options, value, onChange, placeholder = "Select…", emptyText = "No matches." }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = options.filter((o) => value.includes(o.id));
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((o) => (
            <Badge key={o.id} variant="secondary" className="gap-1">
              {o.label}
              <button type="button" onClick={() => toggle(o.id)} aria-label={`Remove ${o.label}`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" className="w-full justify-between">
            <span className="text-muted-foreground">
              {selected.length > 0 ? `${selected.length} selected` : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="p-2 border-b">
            <Input
              autoFocus
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8"
            />
          </div>
          <ScrollArea className="max-h-64">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground text-center">{emptyText}</p>
            ) : (
              <ul>
                {filtered.map((o) => {
                  const checked = value.includes(o.id);
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => toggle(o.id)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left",
                          checked && "bg-accent/50"
                        )}
                      >
                        <span className={cn("h-4 w-4 rounded-sm border grid place-items-center", checked && "bg-primary text-primary-foreground border-primary")}>
                          {checked && <Check className="h-3 w-3" />}
                        </span>
                        <span className="flex-1 truncate">{o.label}</span>
                        {o.hint && <span className="text-xs text-muted-foreground">{o.hint}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
