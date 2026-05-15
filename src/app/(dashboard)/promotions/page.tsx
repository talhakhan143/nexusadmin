import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/modules/page-header";
import { PromotionsView } from "./promotions-view";

export const metadata = { title: "Promotions" };

export default async function PromotionsPage() {
  const session = await auth();
  const canWrite = can(session?.user?.role, "promotions:write");

  const [coupons, flashSales, products, categories] = await Promise.all([
    db.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { products: true, categories: true, orders: true } },
      },
    }),
    db.flashSale.findMany({
      orderBy: { startsAt: "desc" },
      include: { _count: { select: { products: true } } },
    }),
    db.product.findMany({
      where: { status: { in: ["ACTIVE", "DRAFT"] } },
      select: { id: true, name: true, sku: true },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  // Hydrate edit-form initial values for coupons
  const couponWithTargets = await Promise.all(
    coupons.map(async (c) => {
      const productIds =
        c.scope === "PRODUCTS"
          ? (await db.couponProduct.findMany({ where: { couponId: c.id } })).map((p) => p.productId)
          : [];
      const categoryIds =
        c.scope === "CATEGORIES"
          ? (await db.couponCategory.findMany({ where: { couponId: c.id } })).map((p) => p.categoryId)
          : [];
      return { ...c, productIds, categoryIds };
    })
  );

  // Same for flash sales
  const flashSalesWithProducts = await Promise.all(
    flashSales.map(async (fs) => {
      const productIds = (await db.flashSaleProduct.findMany({ where: { flashSaleId: fs.id } })).map((p) => p.productId);
      return { ...fs, productIds };
    })
  );

  return (
    <>
      <PageHeader title="Promotions" description="Coupon codes, flash sales and seasonal campaigns." />
      <PromotionsView
        coupons={couponWithTargets}
        flashSales={flashSalesWithProducts}
        productOptions={products.map((p) => ({ id: p.id, label: p.name, hint: p.sku ?? undefined }))}
        categoryOptions={categories.map((c) => ({ id: c.id, label: c.name }))}
        canWrite={canWrite}
      />
    </>
  );
}
