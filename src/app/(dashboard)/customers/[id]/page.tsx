import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Plus,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Trash2,
} from "lucide-react";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { can } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/modules/order-status-badge";
import { AddressDialog } from "@/components/modules/address-dialog";
import { CustomerEditButton, AddressDeleteButton } from "./profile-actions";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Customer profile" };

const VIP_THRESHOLD = 30000;

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const canWrite = can(session?.user?.role, "customers:write");

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { id: "asc" }] },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { items: { select: { id: true } } },
      },
    },
  });
  if (!customer) notFound();

  const isVip = customer.totalSpent >= VIP_THRESHOLD;
  const initials = (customer.name ?? customer.email)
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const lastOrder = customer.orders[0]?.createdAt;
  const avgOrderValue = customer.ordersCount > 0 ? customer.totalSpent / customer.ordersCount : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{customer.name ?? customer.email}</h1>
              {isVip && <Badge variant="warning">VIP</Badge>}
              {customer.acceptsMarketing && <Badge variant="success">Marketing opt-in</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">Customer since {formatDate(customer.createdAt)}</p>
          </div>
        </div>
        {canWrite && (
          <CustomerEditButton
            customer={{
              id: customer.id,
              email: customer.email,
              name: customer.name ?? "",
              phone: customer.phone ?? "",
              acceptsMarketing: customer.acceptsMarketing,
              notes: customer.notes ?? "",
            }}
          />
        )}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={TrendingUp}
          label="Lifetime value"
          value={formatCurrency(customer.totalSpent)}
          sub={`${formatCurrency(avgOrderValue)} avg order`}
        />
        <StatCard
          icon={ShoppingBag}
          label="Orders"
          value={customer.ordersCount.toString()}
          sub={lastOrder ? `Last: ${formatDate(lastOrder)}` : "No orders yet"}
        />
        <StatCard
          icon={Calendar}
          label="Customer for"
          value={`${Math.max(1, Math.floor((Date.now() - customer.createdAt.getTime()) / 86_400_000))} day(s)`}
          sub={`Joined ${formatDate(customer.createdAt)}`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left — orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order history</CardTitle>
            <CardDescription>Last 20 orders</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {customer.orders.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No orders yet.</div>
            ) : (
              <div className="divide-y">
                {customer.orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/30"
                  >
                    <div>
                      <p className="font-mono text-sm">{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(o.createdAt)} · {o.items.length} item{o.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={o.status} />
                      <PaymentStatusBadge status={o.paymentStatus} />
                      <span className="font-mono text-sm w-24 text-right">
                        {formatCurrency(o.total, o.currency)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right — contact + notes */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" /> {customer.email}
              </p>
              {customer.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" /> {customer.phone}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Internal — not visible to customer.</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.notes ? (
                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No notes.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Addresses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Address book</CardTitle>
              <CardDescription>{customer.addresses.length} saved address(es).</CardDescription>
            </div>
            {canWrite && (
              <AddressDialog
                customerId={customer.id}
                trigger={
                  <Button size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Add address
                  </Button>
                }
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {customer.addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No addresses yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {customer.addresses.map((a) => (
                <div key={a.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <Badge variant="secondary" className="text-[10px]">{a.type}</Badge>
                      {a.isDefault && <Badge variant="success" className="text-[10px]">Default</Badge>}
                    </div>
                    {canWrite && (
                      <div className="flex items-center gap-1">
                        <AddressDialog
                          customerId={customer.id}
                          initial={{
                            id: a.id,
                            type: a.type,
                            firstName: a.firstName ?? "",
                            lastName: a.lastName ?? "",
                            company: a.company ?? "",
                            line1: a.line1,
                            line2: a.line2 ?? "",
                            city: a.city,
                            state: a.state ?? "",
                            country: a.country,
                            postalCode: a.postalCode,
                            phone: a.phone ?? "",
                            isDefault: a.isDefault,
                          }}
                          trigger={
                            <Button size="icon" variant="ghost" className="h-7 w-7">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <AddressDeleteButton addressId={a.id} />
                      </div>
                    )}
                  </div>
                  <Separator />
                  <address className="not-italic text-sm leading-5">
                    <p className="font-medium">
                      {[a.firstName, a.lastName].filter(Boolean).join(" ") || "—"}
                    </p>
                    {a.company && <p className="text-muted-foreground text-xs">{a.company}</p>}
                    <p>{a.line1}</p>
                    {a.line2 && <p>{a.line2}</p>}
                    <p>
                      {a.city}, {a.state ? `${a.state} ` : ""}
                      {a.postalCode}
                    </p>
                    <p>{a.country}</p>
                    {a.phone && <p className="text-muted-foreground text-xs mt-1">{a.phone}</p>}
                  </address>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
