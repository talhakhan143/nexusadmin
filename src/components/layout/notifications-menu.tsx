"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, ShoppingCart, AlertTriangle, RotateCcw, Webhook, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getNotifications, type NotificationItem } from "@/server/actions/notifications";
import { formatDateTime } from "@/lib/utils";

const ICON: Record<NotificationItem["type"], React.ComponentType<{ className?: string }>> = {
  order: ShoppingCart,
  low_stock: AlertTriangle,
  refund: RotateCcw,
  webhook: Webhook,
};

const ICON_BG: Record<NotificationItem["type"], string> = {
  order: "bg-primary/15 text-primary",
  low_stock: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  refund: "bg-destructive/15 text-destructive",
  webhook: "bg-muted text-muted-foreground",
};

const READ_KEY = "nexusadmin.notifications.lastReadAt";

export function NotificationsMenu() {
  const [items, setItems] = React.useState<NotificationItem[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [lastReadAt, setLastReadAt] = React.useState<number>(0);

  React.useEffect(() => {
    const stored = Number(localStorage.getItem(READ_KEY) ?? 0);
    setLastReadAt(stored);
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const fresh = await getNotifications();
      setItems(fresh);
    } finally {
      setLoading(false);
    }
  }

  function markAllRead() {
    const now = Date.now();
    localStorage.setItem(READ_KEY, String(now));
    setLastReadAt(now);
  }

  const unreadCount = items
    ? items.filter((i) => i.createdAt.getTime() > lastReadAt).length
    : 0;

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) void load();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] leading-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <p className="text-sm font-medium">Notifications</p>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {loading && (!items || items.length === 0) ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : !items || items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-2">
              <Inbox className="h-6 w-6" />
              <p className="text-sm">All caught up.</p>
              <p className="text-xs">No recent activity in the last 7 days.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const Icon = ICON[n.type];
                const unread = n.createdAt.getTime() > lastReadAt;
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 p-3 hover:bg-muted/40 transition-colors"
                    >
                      <span className={`grid h-8 w-8 place-items-center rounded-md shrink-0 ${ICON_BG[n.type]}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          {unread && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDateTime(n.createdAt)}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
        <div className="p-2 border-t">
          <Link
            href="/orders"
            onClick={() => setOpen(false)}
            className="block w-full text-center text-xs text-muted-foreground hover:text-foreground py-1.5"
          >
            View all activity in Orders →
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
