import { Plus } from "lucide-react";
import Link from "next/link";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/modules/page-header";
import { CustomersTable } from "./customers-table";
import { customerQuerySchema } from "@/lib/validations/customer";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Customers" };

const VIP_THRESHOLD_CENTS = 30000; // $300+

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const canWrite = can(session?.user?.role, "customers:write");
  const sp = await searchParams;

  const parsed = customerQuerySchema.safeParse({
    q: typeof sp.q === "string" ? sp.q : undefined,
    segment: typeof sp.segment === "string" ? sp.segment : undefined,
    page: sp.page,
    pageSize: sp.pageSize,
    sort: sp.sort,
    order: sp.order,
  });
  const query = parsed.success
    ? parsed.data
    : ({ page: 1, pageSize: 20, sort: "createdAt" as const, order: "desc" as const, segment: "all" as const, q: undefined } as ReturnType<typeof customerQuerySchema.parse>);

  const where: Record<string, unknown> = {
    ...(query.q && {
      OR: [
        { email: { contains: query.q } },
        { name: { contains: query.q } },
        { phone: { contains: query.q } },
      ],
    }),
    ...(query.segment === "new" && { ordersCount: 0 }),
    ...(query.segment === "repeat" && { ordersCount: { gt: 1 } }),
    ...(query.segment === "vip" && { totalSpent: { gte: VIP_THRESHOLD_CENTS } }),
    ...(query.segment === "marketing" && { acceptsMarketing: true }),
  };

  const [customers, total, totals] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { [query.sort]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { _count: { select: { addresses: true } } },
    }),
    db.customer.count({ where }),
    db.customer.aggregate({
      _sum: { totalSpent: true },
      _count: true,
    }),
  ]);

  const rows = customers.map((c) => ({
    id: c.id,
    name: c.name ?? "—",
    email: c.email,
    phone: c.phone ?? "—",
    ordersCount: c.ordersCount,
    totalSpent: formatCurrency(c.totalSpent),
    totalSpentRaw: c.totalSpent,
    acceptsMarketing: c.acceptsMarketing,
    addresses: c._count.addresses,
    createdAt: formatDate(c.createdAt),
  }));

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${total.toLocaleString()} customer${total === 1 ? "" : "s"} · combined LTV ${formatCurrency(totals._sum.totalSpent ?? 0)}`}
      >
        {canWrite && (
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="mr-2 h-4 w-4" /> New customer
            </Link>
          </Button>
        )}
      </PageHeader>
      <CustomersTable
        data={rows}
        currentSegment={query.segment}
        currentQuery={query.q ?? ""}
        vipThreshold={VIP_THRESHOLD_CENTS}
      />
    </>
  );
}
