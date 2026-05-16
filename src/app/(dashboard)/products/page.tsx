import { Plus, Upload } from "lucide-react";
import Link from "next/link";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/modules/page-header";
import { ProductsTable } from "./products-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { productQuerySchema } from "@/lib/validations/product";

export const metadata = { title: "Products" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const canWrite = can(session?.user?.role, "products:write");
  const sp = await searchParams;

  const parsed = productQuerySchema.safeParse({
    q: typeof sp.q === "string" ? sp.q : undefined,
    status: typeof sp.status === "string" ? sp.status : undefined,
    categoryId: typeof sp.categoryId === "string" ? sp.categoryId : undefined,
    page: sp.page,
    pageSize: sp.pageSize,
    sort: sp.sort,
    order: sp.order,
  });
  const query = parsed.success ? parsed.data : { page: 1, pageSize: 20, sort: "createdAt" as const, order: "desc" as const, q: undefined, status: undefined, categoryId: undefined };

  const where = {
    ...(query.q && {
      OR: [
        { name: { contains: query.q } },
        { slug: { contains: query.q } },
        { sku: { contains: query.q } },
      ],
    }),
    ...(query.status && { status: query.status }),
    ...(query.categoryId && { categoryId: query.categoryId }),
  };

  const [products, total, store] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { [query.sort]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        category: { select: { name: true } },
        variants: { select: { stock: true } },
        _count: { select: { variants: true } },
      },
    }),
    db.product.count({ where }),
    db.store.findFirst({ select: { currency: true } }),
  ]);

  const currency = store?.currency ?? "USD";
  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? "—",
    category: p.category?.name ?? "—",
    status: p.status as "ACTIVE" | "DRAFT" | "ARCHIVED",
    price: formatCurrency(p.basePrice, currency),
    stock: p.variants.reduce((s, v) => s + v.stock, 0),
    variants: p._count.variants,
    createdAt: formatDate(p.createdAt),
  }));

  return (
    <>
      <PageHeader
        title="Products"
        description={`${total.toLocaleString()} product${total === 1 ? "" : "s"} · manage catalog, variants, inventory and SEO.`}
      >
        {canWrite && (
          <>
            <Button variant="outline" asChild>
              <Link href="/products/import">
                <Upload className="mr-2 h-4 w-4" /> Import CSV
              </Link>
            </Button>
            <Button asChild>
              <Link href="/products/new">
                <Plus className="mr-2 h-4 w-4" /> New product
              </Link>
            </Button>
          </>
        )}
      </PageHeader>
      <ProductsTable
        data={rows}
        total={total}
        currentStatus={query.status ?? null}
        currentQuery={query.q ?? ""}
        canWrite={canWrite}
      />
    </>
  );
}
