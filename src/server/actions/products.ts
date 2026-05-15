"use server";

import { revalidatePath } from "next/cache";
import type { Prisma, ProductStatus } from "@prisma/client";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { requirePermission } from "@/lib/rbac";
import { productSchema, type ProductInput } from "@/lib/validations/product";
import { slugify } from "@/lib/utils";
import { toCsv, parseCsv } from "@/lib/csv";
import { deleteFile } from "@/lib/blob";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

async function logAudit(
  userId: string | undefined,
  action: string,
  entity: string,
  entityId: string,
  diff?: Record<string, unknown>
) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        diff: diff ? JSON.stringify(diff) : null,
      },
    });
  } catch {
    // best effort
  }
}

async function ensureUniqueSlug(name: string, slug?: string, excludeId?: string): Promise<string> {
  let base = slug && slug.length > 0 ? slug : slugify(name);
  if (!base) base = "product";
  let candidate = base;
  let i = 2;
  while (
    await db.product.findFirst({
      where: { slug: candidate, ...(excludeId && { NOT: { id: excludeId } }) },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${i++}`;
  }
  return candidate;
}

export async function createProduct(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "products:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const slug = await ensureUniqueSlug(data.name, data.slug);

  try {
    const product = await db.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        shortDescription: data.shortDescription ?? null,
        sku: data.sku || null,
        status: data.status,
        basePrice: data.basePrice,
        compareAtPrice: data.compareAtPrice ?? null,
        costPrice: data.costPrice ?? null,
        taxable: data.taxable,
        weight: data.weight ?? null,
        trackInventory: data.trackInventory,
        featured: data.featured,
        categoryId: data.categoryId || null,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
        ogImage: data.ogImage || null,
        images: {
          create: data.images.map((img, i) => ({
            url: img.url,
            alt: img.alt ?? null,
            position: img.position ?? i,
          })),
        },
        variants: {
          create: data.variants.map((v, i) => ({
            sku: v.sku || null,
            name: v.name || null,
            price: v.price,
            compareAtPrice: v.compareAtPrice ?? null,
            costPrice: v.costPrice ?? null,
            stock: v.stock,
            lowStockThreshold: v.lowStockThreshold,
            weight: v.weight ?? null,
            image: v.image || null,
            position: v.position ?? i,
            options: { create: v.options.map((o) => ({ name: o.name, value: o.value })) },
          })),
        },
        tags: {
          create: data.tagIds.map((tagId) => ({ tagId })),
        },
      },
    });

    await logAudit(session?.user?.id, "product.create", "Product", product.id, { name: data.name });
    revalidatePath("/products");
    return { ok: true, data: { id: product.id } };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to create product" };
  }
}

export async function updateProduct(id: string, input: ProductInput): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "products:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const slug = await ensureUniqueSlug(data.name, data.slug, id);

  try {
    // Replace nested children fully (simpler than diffing)
    await db.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.variantOption.deleteMany({ where: { variant: { productId: id } } });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productTag.deleteMany({ where: { productId: id } });

      await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          slug,
          description: data.description ?? null,
          shortDescription: data.shortDescription ?? null,
          sku: data.sku || null,
          status: data.status,
          basePrice: data.basePrice,
          compareAtPrice: data.compareAtPrice ?? null,
          costPrice: data.costPrice ?? null,
          taxable: data.taxable,
          weight: data.weight ?? null,
          trackInventory: data.trackInventory,
          featured: data.featured,
          categoryId: data.categoryId || null,
          metaTitle: data.metaTitle ?? null,
          metaDescription: data.metaDescription ?? null,
          ogImage: data.ogImage || null,
          images: {
            create: data.images.map((img, i) => ({
              url: img.url,
              alt: img.alt ?? null,
              position: img.position ?? i,
            })),
          },
          variants: {
            create: data.variants.map((v, i) => ({
              sku: v.sku || null,
              name: v.name || null,
              price: v.price,
              compareAtPrice: v.compareAtPrice ?? null,
              costPrice: v.costPrice ?? null,
              stock: v.stock,
              lowStockThreshold: v.lowStockThreshold,
              weight: v.weight ?? null,
              image: v.image || null,
              position: v.position ?? i,
              options: { create: v.options.map((o) => ({ name: o.name, value: o.value })) },
            })),
          },
          tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
        },
      });
    });

    await logAudit(session?.user?.id, "product.update", "Product", id, { name: data.name });
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to update product" };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "products:delete");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }

  try {
    const product = await db.product.findUnique({
      where: { id },
      include: { images: true, variants: { select: { image: true } } },
    });
    if (!product) return { ok: false, error: "Product not found" };

    await db.product.delete({ where: { id } });

    // Best-effort blob cleanup
    for (const img of product.images) await deleteFile(img.url).catch(() => {});
    for (const v of product.variants) if (v.image) await deleteFile(v.image).catch(() => {});

    await logAudit(session?.user?.id, "product.delete", "Product", id, { name: product.name });
    revalidatePath("/products");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to delete product" };
  }
}

export async function archiveProducts(ids: string[]): Promise<ActionResult<{ count: number }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "products:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const res = await db.product.updateMany({
    where: { id: { in: ids } },
    data: { status: "ARCHIVED" },
  });
  await logAudit(session?.user?.id, "product.bulk_archive", "Product", ids.join(","), { count: res.count });
  revalidatePath("/products");
  return { ok: true, data: { count: res.count } };
}

export async function setProductStatus(id: string, status: ProductStatus): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "products:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  await db.product.update({ where: { id }, data: { status } });
  await logAudit(session?.user?.id, "product.status_change", "Product", id, { status });
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { ok: true };
}

export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "products:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const src = await db.product.findUnique({
    where: { id },
    include: {
      images: true,
      variants: { include: { options: true } },
      tags: true,
    },
  });
  if (!src) return { ok: false, error: "Source product not found" };

  const slug = await ensureUniqueSlug(`${src.name}-copy`);
  const copy = await db.product.create({
    data: {
      name: `${src.name} (Copy)`,
      slug,
      description: src.description,
      shortDescription: src.shortDescription,
      sku: null,
      status: "DRAFT",
      basePrice: src.basePrice,
      compareAtPrice: src.compareAtPrice,
      costPrice: src.costPrice,
      taxable: src.taxable,
      weight: src.weight,
      trackInventory: src.trackInventory,
      featured: false,
      categoryId: src.categoryId,
      metaTitle: src.metaTitle,
      metaDescription: src.metaDescription,
      ogImage: src.ogImage,
      images: {
        create: src.images.map((img) => ({ url: img.url, alt: img.alt, position: img.position })),
      },
      variants: {
        create: src.variants.map((v) => ({
          sku: null,
          name: v.name,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          costPrice: v.costPrice,
          stock: 0,
          lowStockThreshold: v.lowStockThreshold,
          weight: v.weight,
          image: v.image,
          position: v.position,
          options: { create: v.options.map((o) => ({ name: o.name, value: o.value })) },
        })),
      },
      tags: { create: src.tags.map((t) => ({ tagId: t.tagId })) },
    },
  });
  revalidatePath("/products");
  return { ok: true, data: { id: copy.id } };
}

// ── CSV import / export ──

const CSV_COLUMNS = [
  "name",
  "slug",
  "sku",
  "status",
  "basePrice",
  "compareAtPrice",
  "stock",
  "category",
  "description",
] as const;

export async function exportProductsCsv(): Promise<ActionResult<{ csv: string; count: number }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "products:read");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const products = await db.product.findMany({
    include: {
      category: { select: { slug: true } },
      variants: { select: { stock: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const rows = products.map((p) => ({
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? "",
    status: p.status,
    basePrice: (p.basePrice / 100).toFixed(2),
    compareAtPrice: p.compareAtPrice ? (p.compareAtPrice / 100).toFixed(2) : "",
    stock: p.variants.reduce((s, v) => s + v.stock, 0),
    category: p.category?.slug ?? "",
    description: p.description ?? "",
  }));
  return { ok: true, data: { csv: toCsv(rows), count: rows.length } };
}

export async function importProductsCsv(
  csvText: string,
  opts: { dryRun?: boolean } = {}
): Promise<ActionResult<{ created: number; updated: number; errors: { row: number; message: string }[] }>> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "products:write");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }

  let rows: Record<string, string>[];
  try {
    rows = parseCsv(csvText);
  } catch (e: any) {
    return { ok: false, error: `CSV parse: ${e.message}` };
  }

  const summary = { created: 0, updated: 0, errors: [] as { row: number; message: string }[] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +1 header, +1 1-indexed
    try {
      const name = (row.name ?? "").trim();
      if (!name) {
        summary.errors.push({ row: rowNum, message: "Missing name" });
        continue;
      }
      const slug = row.slug?.trim() || slugify(name);
      const basePrice = Math.round(Number(row.basePrice ?? 0) * 100);
      if (!Number.isFinite(basePrice) || basePrice < 0) {
        summary.errors.push({ row: rowNum, message: "Invalid basePrice" });
        continue;
      }
      const status = (row.status?.trim().toUpperCase() ?? "DRAFT") as ProductStatus;
      const categorySlug = row.category?.trim();
      let categoryId: string | null = null;
      if (categorySlug) {
        const cat = await db.category.findUnique({ where: { slug: categorySlug } });
        categoryId = cat?.id ?? null;
      }

      if (opts.dryRun) {
        summary.created++;
        continue;
      }

      const existing = await db.product.findUnique({ where: { slug } });
      if (existing) {
        await db.product.update({
          where: { id: existing.id },
          data: {
            name,
            sku: row.sku || null,
            status,
            basePrice,
            compareAtPrice: row.compareAtPrice ? Math.round(Number(row.compareAtPrice) * 100) : null,
            description: row.description || null,
            categoryId,
          },
        });
        summary.updated++;
      } else {
        await db.product.create({
          data: {
            name,
            slug,
            sku: row.sku || null,
            status,
            basePrice,
            compareAtPrice: row.compareAtPrice ? Math.round(Number(row.compareAtPrice) * 100) : null,
            description: row.description || null,
            categoryId,
          },
        });
        summary.created++;
      }
    } catch (e: any) {
      summary.errors.push({ row: rowNum, message: e.message ?? "Unknown error" });
    }
  }

  if (!opts.dryRun) revalidatePath("/products");
  return { ok: true, data: summary };
}
