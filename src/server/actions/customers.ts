"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { requirePermission } from "@/lib/rbac";
import {
  customerSchema,
  addressSchema,
  type CustomerInput,
  type AddressInput,
} from "@/lib/validations/customer";
import { toCsv } from "@/lib/csv";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

export async function createCustomer(input: CustomerInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "customers:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const exists = await db.customer.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { ok: false, error: "Email already registered" };

  const c = await db.customer.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name ?? null,
      phone: parsed.data.phone ?? null,
      acceptsMarketing: parsed.data.acceptsMarketing,
      notes: parsed.data.notes ?? null,
    },
  });
  revalidatePath("/customers");
  return { ok: true, data: { id: c.id } };
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "customers:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  // Email change uniqueness
  const existing = await db.customer.findUnique({ where: { email: parsed.data.email } });
  if (existing && existing.id !== id) return { ok: false, error: "Email already in use" };

  await db.customer.update({
    where: { id },
    data: {
      email: parsed.data.email,
      name: parsed.data.name ?? null,
      phone: parsed.data.phone ?? null,
      acceptsMarketing: parsed.data.acceptsMarketing,
      notes: parsed.data.notes ?? null,
    },
  });
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { ok: true };
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  const session = await auth();
  // Treat as a write op (customers can have orders); only admins+ can hard-delete
  if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
    return { ok: false, error: "Forbidden" };
  }
  // Check for orders — refuse if any
  const orderCount = await db.order.count({ where: { customerId: id } });
  if (orderCount > 0) {
    return { ok: false, error: `Cannot delete — customer has ${orderCount} order(s).` };
  }
  await db.customer.delete({ where: { id } });
  revalidatePath("/customers");
  return { ok: true };
}

export async function addAddress(customerId: string, input: AddressInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "customers:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  // If marking default, unset others
  if (parsed.data.isDefault) {
    await db.address.updateMany({ where: { customerId, isDefault: true }, data: { isDefault: false } });
  }

  const a = await db.address.create({
    data: { ...parsed.data, customerId },
  });
  revalidatePath(`/customers/${customerId}`);
  return { ok: true, data: { id: a.id } };
}

export async function updateAddress(addressId: string, input: AddressInput): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "customers:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const addr = await db.address.findUnique({ where: { id: addressId } });
  if (!addr) return { ok: false, error: "Address not found" };

  if (parsed.data.isDefault) {
    await db.address.updateMany({
      where: { customerId: addr.customerId, isDefault: true, NOT: { id: addressId } },
      data: { isDefault: false },
    });
  }

  await db.address.update({ where: { id: addressId }, data: parsed.data });
  revalidatePath(`/customers/${addr.customerId}`);
  return { ok: true };
}

export async function deleteAddress(addressId: string): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "customers:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const addr = await db.address.findUnique({ where: { id: addressId } });
  if (!addr) return { ok: false, error: "Address not found" };
  await db.address.delete({ where: { id: addressId } });
  revalidatePath(`/customers/${addr.customerId}`);
  return { ok: true };
}

export async function exportCustomersCsv(): Promise<ActionResult<{ csv: string; count: number }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "customers:read");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const customers = await db.customer.findMany({ orderBy: { createdAt: "desc" } });
  const rows = customers.map((c) => ({
    email: c.email,
    name: c.name ?? "",
    phone: c.phone ?? "",
    ordersCount: c.ordersCount,
    totalSpent: (c.totalSpent / 100).toFixed(2),
    acceptsMarketing: c.acceptsMarketing ? "yes" : "no",
    createdAt: c.createdAt.toISOString(),
  }));
  return { ok: true, data: { csv: toCsv(rows), count: rows.length } };
}

/**
 * Recompute aggregate fields (totalSpent, ordersCount) from PAID orders.
 * Useful after manual data fixes.
 */
export async function recomputeCustomerAggregates(customerId?: string): Promise<ActionResult<{ updated: number }>> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") return { ok: false, error: "Super admin only" };

  const where = customerId ? { id: customerId } : {};
  const customers = await db.customer.findMany({ where });
  let updated = 0;
  for (const c of customers) {
    const agg = await db.order.aggregate({
      where: { customerId: c.id, paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
      _sum: { total: true },
      _count: true,
    });
    await db.customer.update({
      where: { id: c.id },
      data: { totalSpent: agg._sum.total ?? 0, ordersCount: agg._count },
    });
    updated++;
  }
  revalidatePath("/customers");
  return { ok: true, data: { updated } };
}
