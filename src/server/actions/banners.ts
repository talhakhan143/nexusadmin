"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { requirePermission } from "@/lib/rbac";
import { bannerSchema, type BannerInput } from "@/lib/validations/banner";
import { deleteFile } from "@/lib/blob";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

function normalize(input: BannerInput) {
  return {
    name: input.name,
    placement: input.placement,
    customKey: input.placement === "CUSTOM" ? input.customKey || null : null,
    title: input.title || null,
    subtitle: input.subtitle || null,
    ctaText: input.ctaText || null,
    ctaUrl: input.ctaUrl || null,
    image: input.image,
    imageMobile: input.imageMobile || null,
    alt: input.alt || null,
    bgColor: input.bgColor || null,
    textColor: input.textColor || null,
    linkUrl: input.linkUrl || null,
    targetCategoryId: input.targetCategoryId || null,
    targetProductId: input.targetProductId || null,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    position: input.position,
    isActive: input.isActive,
  };
}

export async function createBanner(input: BannerInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "banners:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const banner = await db.banner.create({ data: normalize(parsed.data) });
  revalidatePath("/banners");
  return { ok: true, data: { id: banner.id } };
}

export async function updateBanner(id: string, input: BannerInput): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "banners:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  await db.banner.update({ where: { id }, data: normalize(parsed.data) });
  revalidatePath("/banners");
  return { ok: true };
}

export async function toggleBannerActive(id: string): Promise<ActionResult<{ isActive: boolean }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "banners:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const b = await db.banner.findUnique({ where: { id }, select: { isActive: true } });
  if (!b) return { ok: false, error: "Banner not found" };
  const updated = await db.banner.update({ where: { id }, data: { isActive: !b.isActive } });
  revalidatePath("/banners");
  return { ok: true, data: { isActive: updated.isActive } };
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "banners:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const banner = await db.banner.findUnique({ where: { id } });
  if (!banner) return { ok: false, error: "Banner not found" };
  await db.banner.delete({ where: { id } });
  // Best-effort image cleanup
  await deleteFile(banner.image).catch(() => {});
  if (banner.imageMobile) await deleteFile(banner.imageMobile).catch(() => {});
  revalidatePath("/banners");
  return { ok: true };
}
