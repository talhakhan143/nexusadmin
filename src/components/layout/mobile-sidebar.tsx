"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { NAV } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";

interface MobileSidebarProps {
  role: UserRole;
}

export function MobileSidebar({ role }: MobileSidebarProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="px-4 py-3 border-b text-left">
          <SheetTitle className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            {siteConfig.name}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV.map((group) => {
            const visible = group.items.filter((i) => !i.permission || can(role, i.permission));
            if (visible.length === 0) return null;
            return (
              <div key={group.title} className="mb-4">
                <div className="px-4 mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </div>
                <ul className="space-y-0.5 px-2">
                  {visible.map((item) => {
                    const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                            active && "bg-accent text-accent-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
