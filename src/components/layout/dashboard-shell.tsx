"use client";

import * as React from "react";
import type { UserRole } from "@prisma/client";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const COLLAPSE_KEY = "nexusadmin.sidebar.collapsed";

interface DashboardShellProps {
  user: { name?: string | null; email?: string | null; image?: string | null; role: UserRole };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem(COLLAPSE_KEY);
    if (stored) setCollapsed(stored === "1");
  }, []);

  const toggle = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-muted/20">
      <div className="print:hidden contents">
        <Sidebar role={user.role} collapsed={collapsed} onToggle={toggle} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="print:hidden">
          <Topbar user={user} />
        </div>
        <main className="flex-1 p-4 md:p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
