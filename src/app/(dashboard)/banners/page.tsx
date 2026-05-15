import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/modules/page-header";
import { BannersView } from "./banners-view";

export const metadata = { title: "Banners" };

export default async function BannersPage() {
  const session = await auth();
  const canWrite = can(session?.user?.role, "banners:write");

  const [banners, categories, products] = await Promise.all([
    db.banner.findMany({
      orderBy: [{ placement: "asc" }, { position: "asc" }, { createdAt: "desc" }],
      include: {
        targetCategory: { select: { id: true, name: true } },
        targetProduct: { select: { id: true, name: true } },
      },
    }),
    db.category.findMany({ select: { id: true, name: true, parentId: true } }),
    db.product.findMany({
      where: { status: { in: ["ACTIVE", "DRAFT"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Banners"
        description={`${banners.length} banner(s) · storefronts fetch by placement key.`}
      />
      <BannersView
        banners={banners.map((b) => ({
          id: b.id,
          name: b.name,
          placement: b.placement,
          customKey: b.customKey,
          title: b.title,
          subtitle: b.subtitle,
          ctaText: b.ctaText,
          ctaUrl: b.ctaUrl,
          image: b.image,
          imageMobile: b.imageMobile,
          alt: b.alt,
          bgColor: b.bgColor,
          textColor: b.textColor,
          linkUrl: b.linkUrl,
          targetCategoryId: b.targetCategoryId,
          targetProductId: b.targetProductId,
          targetCategoryName: b.targetCategory?.name ?? null,
          targetProductName: b.targetProduct?.name ?? null,
          startsAt: b.startsAt ? b.startsAt.toISOString() : null,
          endsAt: b.endsAt ? b.endsAt.toISOString() : null,
          position: b.position,
          isActive: b.isActive,
        }))}
        categories={categories}
        products={products}
        canWrite={canWrite}
      />
    </>
  );
}
