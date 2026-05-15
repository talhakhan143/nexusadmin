"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./theme-toggle";
import { ColorPicker } from "./color-picker";
import { UserMenu } from "./user-menu";
import { MobileSidebar } from "./mobile-sidebar";
import { NotificationsMenu } from "./notifications-menu";

interface TopbarProps {
  user: { name?: string | null; email?: string | null; image?: string | null; role: UserRole };
}

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <MobileSidebar role={user.role} />

      <div className="relative hidden md:block max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search products, orders, customers…" className="pl-9 h-9" />
      </div>

      <div className="flex-1 md:hidden" />

      <div className="ml-auto flex items-center gap-1.5">
        <ColorPicker />
        <ThemeToggle />
        <NotificationsMenu />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
