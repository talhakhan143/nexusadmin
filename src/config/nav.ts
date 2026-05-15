import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  BarChart3,
  CreditCard,
  Settings,
  Boxes,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/rbac";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  badge?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [{ title: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    title: "Catalog",
    items: [
      { title: "Products", href: "/products", icon: Package, permission: "products:read" },
      { title: "Categories", href: "/categories", icon: Boxes, permission: "products:read" },
    ],
  },
  {
    title: "Sales",
    items: [
      { title: "Orders", href: "/orders", icon: ShoppingCart, permission: "orders:read" },
      { title: "Customers", href: "/customers", icon: Users, permission: "customers:read" },
      { title: "Promotions", href: "/promotions", icon: Tag, permission: "promotions:read" },
    ],
  },
  {
    title: "Insights",
    items: [
      { title: "Analytics", href: "/analytics", icon: BarChart3, permission: "analytics:read" },
      { title: "Payments", href: "/payments", icon: CreditCard, permission: "orders:read" },
    ],
  },
  {
    title: "System",
    items: [{ title: "Settings", href: "/settings", icon: Settings, permission: "settings:manage" }],
  },
];
