import type { OrderStatus } from "@prisma/client";
import { Clock, CheckCircle2, Truck, PackageCheck, XCircle, RotateCcw } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TimelineEntry {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  createdAt: Date;
  changedBy?: { name: string | null; email: string } | null;
}

const STATUS_ICON: Record<OrderStatus, React.ComponentType<{ className?: string }>> = {
  PENDING: Clock,
  PROCESSING: Clock,
  SHIPPED: Truck,
  DELIVERED: PackageCheck,
  CANCELLED: XCircle,
  REFUNDED: RotateCcw,
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30",
  PROCESSING: "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/30",
  SHIPPED: "bg-primary/15 text-primary ring-primary/30",
  DELIVERED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30",
  CANCELLED: "bg-destructive/15 text-destructive ring-destructive/30",
  REFUNDED: "bg-destructive/15 text-destructive ring-destructive/30",
};

export function OrderTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No status changes yet.</p>;
  }
  return (
    <ol className="space-y-4">
      {entries.map((e, idx) => {
        const Icon = STATUS_ICON[e.toStatus];
        return (
          <li key={e.id} className="relative pl-9">
            <span
              className={cn(
                "absolute left-0 top-0.5 grid h-7 w-7 place-items-center rounded-full ring-2",
                STATUS_COLOR[e.toStatus]
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            {idx < entries.length - 1 && (
              <span className="absolute left-3.5 top-7 h-full w-px bg-border -translate-x-1/2" />
            )}
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                {e.fromStatus ? `${e.fromStatus} → ${e.toStatus}` : `Created as ${e.toStatus}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(e.createdAt)}
                {e.changedBy && ` · by ${e.changedBy.name ?? e.changedBy.email}`}
              </p>
              {e.note && <p className="text-sm text-muted-foreground italic">"{e.note}"</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
