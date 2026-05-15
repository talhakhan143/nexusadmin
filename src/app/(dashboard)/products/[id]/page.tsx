import { notFound, redirect } from "next/navigation";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { can } from "@/lib/rbac";
import { ProductForm } from "@/components/modules/product-form";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!can(session?.user?.role, "products:write")) redirect("/products");

  const [product, categories, tags] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: {
          orderBy: { position: "asc" },
          include: { options: true },
        },
        tags: true,
      },
    }),
    db.category.findMany({ select: { id: true, name: true, parentId: true } }),
    db.tag.findMany({ select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  const initial = {
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    sku: product.sku,
    status: product.status,
    basePrice: product.basePrice,
    compareAtPrice: product.compareAtPrice,
    costPrice: product.costPrice,
    taxable: product.taxable,
    weight: product.weight,
    trackInventory: product.trackInventory,
    featured: product.featured,
    categoryId: product.categoryId,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    ogImage: product.ogImage ?? "",
    images: product.images.map((i) => ({ url: i.url, alt: i.alt, position: i.position })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      costPrice: v.costPrice,
      stock: v.stock,
      lowStockThreshold: v.lowStockThreshold,
      weight: v.weight,
      image: v.image ?? "",
      position: v.position,
      options: v.options.map((o) => ({ name: o.name, value: o.value })),
    })),
    tagIds: product.tags.map((t) => t.tagId),
  };

  return <ProductForm mode="edit" productId={id} initial={initial} categories={categories} tags={tags} />;
}
