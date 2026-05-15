import { UserRole } from "@prisma/client";

export type Permission =
  | "users:manage"
  | "store:manage"
  | "products:read"
  | "products:write"
  | "products:delete"
  | "orders:read"
  | "orders:write"
  | "orders:refund"
  | "customers:read"
  | "customers:write"
  | "promotions:read"
  | "promotions:write"
  | "analytics:read"
  | "settings:manage"
  | "apikeys:manage"
  | "banners:read"
  | "banners:write";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "users:manage",
    "store:manage",
    "products:read",
    "products:write",
    "products:delete",
    "orders:read",
    "orders:write",
    "orders:refund",
    "customers:read",
    "customers:write",
    "promotions:read",
    "promotions:write",
    "analytics:read",
    "settings:manage",
    "apikeys:manage",
    "banners:read",
    "banners:write",
  ],
  ADMIN: [
    "store:manage",
    "products:read",
    "products:write",
    "products:delete",
    "orders:read",
    "orders:write",
    "orders:refund",
    "customers:read",
    "customers:write",
    "promotions:read",
    "promotions:write",
    "analytics:read",
    "settings:manage",
    "banners:read",
    "banners:write",
  ],
  MANAGER: [
    "products:read",
    "products:write",
    "orders:read",
    "orders:write",
    "customers:read",
    "customers:write",
    "promotions:read",
    "promotions:write",
    "analytics:read",
    "banners:read",
    "banners:write",
  ],
  VIEWER: [
    "products:read",
    "orders:read",
    "customers:read",
    "promotions:read",
    "analytics:read",
    "banners:read",
  ],
};

export function can(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAny(role: UserRole | undefined | null, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

export function canAll(role: UserRole | undefined | null, permissions: Permission[]): boolean {
  return permissions.every((p) => can(role, p));
}

/**
 * Throws if the role lacks the required permission.
 * Use inside Server Actions to enforce authorization.
 */
export function requirePermission(role: UserRole | undefined | null, permission: Permission): void {
  if (!can(role, permission)) {
    throw new Error(`Forbidden: missing permission "${permission}"`);
  }
}
