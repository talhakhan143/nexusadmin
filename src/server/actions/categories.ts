"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { requirePermission } from "@/lib/rbac";
import { categorySchema, tagSchema, type CategoryInput, type TagInput } from "@/lib/validations/category";
import { slugify } from "@/lib/utils";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

async function uniqueCategorySlug(name: string, slug?: string, excludeId?: string): Promise<string> {
  let base = slug && slug.length > 0 ? slug : slugify(name);
  if (!base) base = "category";
  let candidate = base;
  let i = 2;
  while (
    await db.category.findFirst({
      where: { slug: candidate, ...(excludeId && { NOT: { id: excludeId } }) },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${i++}`;
  }
  return candidate;
}

export async function createCategory(input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "products:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const data = parsed.data;
  const slug = await uniqueCategorySlug(data.name, data.slug);

  const cat = await db.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description ?? null,
      image: data.image || null,
      parentId: data.parentId || null,
      position: data.position,
      metaTitle: data.metaTitle ?? null,
      metaDescription: data.metaDescription ?? null,
    },
  });
  revalidatePath("/categories");
  revalidatePath("/products");
  return { ok: true, data: { id: cat.id } };
}

export async function updateCategory(id: string, input: CategoryInput): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "products:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  // Prevent setting self or descendant as parent
  if (data.parentId === id) return { ok: false, error: "Category cannot be its own parent" };
  if (data.parentId) {
    const descendantIds = await collectDescendantIds(id);
    if (descendantIds.includes(data.parentId)) {
      return { ok: false, error: "Cannot set a descendant as parent" };
    }
  }

  const slug = await uniqueCategorySlug(data.name, data.slug, id);

  await db.category.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      description: data.description ?? null,
      image: data.image || null,
      parentId: data.parentId || null,
      position: data.position,
      metaTitle: data.metaTitle ?? null,
      metaDescription: data.metaDescription ?? null,
    },
  });
  revalidatePath("/categories");
  revalidatePath("/products");
  return { ok: true };
}

async function collectDescendantIds(rootId: string): Promise<string[]> {
  const all: string[] = [];
  const queue = [rootId];
  while (queue.length) {
    const parentId = queue.shift()!;
    const kids = await db.category.findMany({ where: { parentId }, select: { id: true } });
    for (const k of kids) {
      all.push(k.id);
      queue.push(k.id);
    }
  }
  return all;
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "products:delete");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  // Children are reparented to null automatically (SetNull). Products lose category.
  await db.category.delete({ where: { id } });
  revalidatePath("/categories");
  revalidatePath("/products");
  return { ok: true };
}

// ── Tags ──

export async function listTags() {
  return db.tag.findMany({ orderBy: { name: "asc" } });
}

export async function createTag(input: TagInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "products:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = tagSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const exists = await db.tag.findFirst({ where: { OR: [{ slug: data.slug }, { name: data.name }] } });
  if (exists) return { ok: true, data: { id: exists.id } };

  const tag = await db.tag.create({ data });
  return { ok: true, data: { id: tag.id } };
}

export async function deleteTag(id: string): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "products:delete");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  await db.tag.delete({ where: { id } });
  revalidatePath("/products");
  return { ok: true };
}
