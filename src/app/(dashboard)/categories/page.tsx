import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/modules/page-header";
import { CategoriesView } from "./categories-view";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const session = await auth();
  const canWrite = can(session?.user?.role, "products:write");
  const canDelete = can(session?.user?.role, "products:delete");

  const categories = await db.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true, children: true } } },
  });

  const flat = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    description: c.description,
    image: c.image,
    position: c.position,
    metaTitle: c.metaTitle,
    metaDescription: c.metaDescription,
    productCount: c._count.products,
    childCount: c._count.children,
  }));

  return (
    <>
      <PageHeader title="Categories" description="Hierarchical organization. Drag children under parents." />
      <CategoriesView categories={flat} canWrite={canWrite} canDelete={canDelete} />
    </>
  );
}
