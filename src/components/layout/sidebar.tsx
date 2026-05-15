"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { NAV } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  role: UserRole;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ role, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          {!collapsed && <span className="truncate">{siteConfig.name}</span>}
        </Link>
        <Button variant="ghost" size="icon" onClick={onToggle} className="hidden md:flex">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {NAV.map((group) => {
          const visible = group.items.filter((i) => !i.permission || can(role, i.permission));
          if (visible.length === 0) return null;
          return (
            <div key={group.title} className="mb-4">
              {!collapsed && (
                <div className="px-4 mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </div>
              )}
              <ul className="space-y-0.5 px-2">
                {visible.map((item) => {
                  const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          active && "bg-sidebar-accent text-sidebar-accent-foreground",
                          collapsed && "justify-center px-2"
                        )}
                        title={collapsed ? item.title : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground">
          <p>v0.1.0 · {siteConfig.name}</p>
        </div>
      )}
    </aside>
  );
}
