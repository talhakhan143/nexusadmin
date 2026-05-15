"use server";

import { revalidatePath } from "next/cache";
import type { CouponType } from "@prisma/client";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { requirePermission } from "@/lib/rbac";
import {
  couponSchema,
  flashSaleSchema,
  type CouponInput,
  type FlashSaleInput,
} from "@/lib/validations/promotion";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

// ── Coupons ──

export async function createCoupon(input: CouponInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "promotions:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const exists = await db.coupon.findUnique({ where: { code: parsed.data.code } });
  if (exists) return { ok: false, error: "Code already in use" };

  const data = parsed.data;
  const coupon = await db.coupon.create({
    data: {
      code: data.code,
      description: data.description ?? null,
      type: data.type,
      value: data.value,
      minPurchase: data.minPurchase ?? null,
      maxDiscount: data.maxDiscount ?? null,
      usageLimit: data.usageLimit ?? null,
      perCustomerLimit: data.perCustomerLimit ?? null,
      scope: data.scope,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive,
      products: data.scope === "PRODUCTS" ? { create: data.productIds.map((id) => ({ productId: id })) } : undefined,
      categories: data.scope === "CATEGORIES" ? { create: data.categoryIds.map((id) => ({ categoryId: id })) } : undefined,
    },
  });
  revalidatePath("/promotions");
  return { ok: true, data: { id: coupon.id } };
}

export async function updateCoupon(id: string, input: CouponInput): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "promotions:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const existing = await db.coupon.findUnique({ where: { code: parsed.data.code } });
  if (existing && existing.id !== id) return { ok: false, error: "Code already in use" };

  const data = parsed.data;
  await db.$transaction(async (tx) => {
    await tx.couponProduct.deleteMany({ where: { couponId: id } });
    await tx.couponCategory.deleteMany({ where: { couponId: id } });
    await tx.coupon.update({
      where: { id },
      data: {
        code: data.code,
        description: data.description ?? null,
        type: data.type,
        value: data.value,
        minPurchase: data.minPurchase ?? null,
        maxDiscount: data.maxDiscount ?? null,
        usageLimit: data.usageLimit ?? null,
        perCustomerLimit: data.perCustomerLimit ?? null,
        scope: data.scope,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive,
        products: data.scope === "PRODUCTS" ? { create: data.productIds.map((pid) => ({ productId: pid })) } : undefined,
        categories: data.scope === "CATEGORIES" ? { create: data.categoryIds.map((cid) => ({ categoryId: cid })) } : undefined,
      },
    });
  });
  revalidatePath("/promotions");
  return { ok: true };
}

export async function toggleCouponActive(id: string): Promise<ActionResult<{ isActive: boolean }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "promotions:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const c = await db.coupon.findUnique({ where: { id }, select: { isActive: true } });
  if (!c) return { ok: false, error: "Coupon not found" };
  const updated = await db.coupon.update({ where: { id }, data: { isActive: !c.isActive } });
  revalidatePath("/promotions");
  return { ok: true, data: { isActive: updated.isActive } };
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "promotions:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  // Refuse if coupon has been used on orders
  const used = await db.order.count({ where: { couponId: id } });
  if (used > 0) {
    return { ok: false, error: `Cannot delete — coupon used on ${used} order(s). Deactivate instead.` };
  }
  await db.coupon.delete({ where: { id } });
  revalidatePath("/promotions");
  return { ok: true };
}

/**
 * Cart-side validation. Used by the storefront API or admin "test coupon".
 * Returns the discount in cents that would apply for the given subtotal.
 */
export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<ActionResult<{ discount: number; freeShipping: boolean; type: CouponType; description: string | null }>> {
  const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon) return { ok: false, error: "Code not found" };
  if (!coupon.isActive) return { ok: false, error: "Coupon inactive" };
  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) return { ok: false, error: "Not started yet" };
  if (coupon.expiresAt && now > coupon.expiresAt) return { ok: false, error: "Expired" };
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return { ok: false, error: "Usage limit reached" };
  if (coupon.minPurchase && subtotal < coupon.minPurchase) {
    return { ok: false, error: `Minimum purchase $${(coupon.minPurchase / 100).toFixed(2)}` };
  }

  let discount = 0;
  let freeShipping = false;
  if (coupon.type === "PERCENTAGE") {
    discount = Math.round(subtotal * (coupon.value / 100));
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === "FIXED") {
    discount = Math.min(coupon.value, subtotal);
  } else if (coupon.type === "FREE_SHIPPING") {
    freeShipping = true;
  }

  return {
    ok: true,
    data: { discount, freeShipping, type: coupon.type, description: coupon.description },
  };
}

// ── Flash sales ──

export async function createFlashSale(input: FlashSaleInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "promotions:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = flashSaleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const data = parsed.data;
  const fs = await db.flashSale.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      discountType: data.discountType,
      discountValue: data.discountValue,
      isActive: data.isActive,
      products: { create: data.productIds.map((id) => ({ productId: id })) },
    },
  });
  revalidatePath("/promotions");
  return { ok: true, data: { id: fs.id } };
}

export async function updateFlashSale(id: string, input: FlashSaleInput): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "promotions:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = flashSaleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const data = parsed.data;
  await db.$transaction(async (tx) => {
    await tx.flashSaleProduct.deleteMany({ where: { flashSaleId: id } });
    await tx.flashSale.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description ?? null,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        discountType: data.discountType,
        discountValue: data.discountValue,
        isActive: data.isActive,
        products: { create: data.productIds.map((pid) => ({ productId: pid })) },
      },
    });
  });
  revalidatePath("/promotions");
  return { ok: true };
}

export async function toggleFlashSaleActive(id: string): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "promotions:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const fs = await db.flashSale.findUnique({ where: { id } });
  if (!fs) return { ok: false, error: "Flash sale not found" };
  await db.flashSale.update({ where: { id }, data: { isActive: !fs.isActive } });
  revalidatePath("/promotions");
  return { ok: true };
}

export async function deleteFlashSale(id: string): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "promotions:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  await db.flashSale.delete({ where: { id } });
  revalidatePath("/promotions");
  return { ok: true };
}
