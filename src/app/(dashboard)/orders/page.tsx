import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/modules/page-header";
import { OrdersTable } from "./orders-table";
import { orderQuerySchema } from "@/lib/validations/order";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SeedOrdersButton } from "./seed-orders-button";

export const metadata = { title: "Orders" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const sp = await searchParams;
  const canRefund = can(session?.user?.role, "orders:refund");

  const parsed = orderQuerySchema.safeParse({
    q: typeof sp.q === "string" ? sp.q : undefined,
    status: typeof sp.status === "string" ? sp.status : undefined,
    paymentStatus: typeof sp.paymentStatus === "string" ? sp.paymentStatus : undefined,
    customerId: typeof sp.customerId === "string" ? sp.customerId : undefined,
    from: typeof sp.from === "string" ? sp.from : undefined,
    to: typeof sp.to === "string" ? sp.to : undefined,
    page: sp.page,
    pageSize: sp.pageSize,
  });
  const query = parsed.success
    ? parsed.data
    : ({ page: 1, pageSize: 20, q: undefined, status: undefined, paymentStatus: undefined, customerId: undefined, from: undefined, to: undefined } as ReturnType<typeof orderQuerySchema.parse>);

  const where = {
    ...(query.q && {
      OR: [
        { orderNumber: { contains: query.q } },
        { customer: { email: { contains: query.q } } },
        { customer: { name: { contains: query.q } } },
        { trackingNumber: { contains: query.q } },
      ],
    }),
    ...(query.status && { status: query.status }),
    ...(query.paymentStatus && { paymentStatus: query.paymentStatus }),
    ...(query.customerId && { customerId: query.customerId }),
    ...((query.from || query.to) && {
      createdAt: {
        ...(query.from && { gte: new Date(query.from) }),
        ...(query.to && { lte: new Date(`${query.to}T23:59:59`) }),
      },
    }),
  };

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        customer: { select: { name: true, email: true } },
        items: { select: { id: true } },
      },
    }),
    db.order.count({ where }),
  ]);

  const rows = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customer: o.customer?.name ?? o.customer?.email ?? "Guest",
    customerEmail: o.customer?.email ?? "",
    status: o.status,
    paymentStatus: o.paymentStatus,
    items: o.items.length,
    total: formatCurrency(o.total, o.currency),
    createdAt: formatDate(o.createdAt),
  }));

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${total.toLocaleString()} order${total === 1 ? "" : "s"} · workflow, fulfilment, refunds.`}
      >
        {total === 0 && canRefund && <SeedOrdersButton />}
      </PageHeader>
      <OrdersTable
        data={rows}
        currentStatus={query.status ?? null}
        currentPaymentStatus={query.paymentStatus ?? null}
        currentFrom={query.from ?? ""}
        currentTo={query.to ?? ""}
        currentQuery={query.q ?? ""}
      />
    </>
  );
}
