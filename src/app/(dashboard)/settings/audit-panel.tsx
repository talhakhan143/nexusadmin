"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDateTime } from "@/lib/utils";

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  user: { name: string | null; email: string } | null;
  createdAt: Date;
  diff: string | null;
}

const ENTITY_VARIANT: Record<string, "default" | "secondary" | "warning" | "destructive" | "success" | "outline"> = {
  Product: "default",
  Order: "secondary",
  Customer: "warning",
  Webhook: "outline",
};

export function AuditPanel({ entries }: { entries: AuditEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit log</CardTitle>
        <CardDescription>Last 50 actions taken in this admin. Mutations include diff payloads.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No log entries yet.</p>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <ul className="divide-y">
              {entries.map((e) => (
                <li key={e.id} className="p-3 hover:bg-muted/30">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={ENTITY_VARIANT[e.entity] ?? "secondary"}>{e.entity}</Badge>
                      <code className="text-xs font-medium">{e.action}</code>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {e.user ? `${e.user.name ?? e.user.email}` : "system"}
                    {e.entityId && ` · entity ${e.entityId.slice(-8)}`}
                  </p>
                  {e.diff && (
                    <details className="mt-1.5">
                      <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">View payload</summary>
                      <pre className="text-[10px] mt-1 rounded bg-muted/50 p-2 overflow-x-auto font-mono">
                        {tryFormat(e.diff)}
                      </pre>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function tryFormat(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}
