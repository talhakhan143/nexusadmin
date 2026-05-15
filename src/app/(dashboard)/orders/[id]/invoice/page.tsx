import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrintTrigger } from "./print-trigger";

export const metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, store] = await Promise.all([
    db.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        billingAddress: true,
        shippingAddress: true,
        coupon: true,
      },
    }),
    db.store.findFirst(),
  ]);
  if (!order) notFound();

  return (
    <div className="bg-white text-black min-h-screen p-6 sm:p-12 print:p-0">
      <style>{`@media print { body { background: white !important; } @page { margin: 18mm; } .no-print { display: none !important; } }`}</style>

      <div className="no-print mb-6 flex items-center justify-between">
        <a href={`/orders/${order.id}`} className="text-sm text-blue-600 hover:underline">← Back to order</a>
        <PrintTrigger />
      </div>

      <div className="max-w-3xl mx-auto bg-white">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold">{store?.name ?? "NexusAdmin"}</h1>
            {store?.email && <p className="text-sm text-gray-600">{store.email}</p>}
            {(store?.addressLine1 || store?.city) && (
              <p className="text-xs text-gray-600 mt-2 leading-5">
                {store?.addressLine1}
                {store?.city && <><br />{store.city}{store.state ? `, ${store.state}` : ""} {store.postalCode}</>}
                {store?.country && <><br />{store.country}</>}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tracking-tight uppercase text-gray-800">Invoice</p>
            <p className="text-sm font-mono mt-1">{order.orderNumber}</p>
            <p className="text-xs text-gray-600 mt-2">Issued: {formatDate(order.createdAt)}</p>
            <p className="text-xs text-gray-600">Status: <span className="font-medium">{order.status}</span></p>
            <p className="text-xs text-gray-600">Payment: <span className="font-medium">{order.paymentStatus}</span></p>
          </div>
        </div>

        {/* Bill / ship to */}
        <div className="grid grid-cols-2 gap-8 mt-6">
          <AddressBlock title="Bill to" address={order.billingAddress} customerEmail={order.customer?.email} />
          <AddressBlock title="Ship to" address={order.shippingAddress} customerEmail={order.customer?.email} />
        </div>

        {/* Items */}
        <table className="w-full mt-8 text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium text-gray-700">Item</th>
              <th className="text-right py-2 font-medium text-gray-700 w-16">Qty</th>
              <th className="text-right py-2 font-medium text-gray-700 w-24">Unit</th>
              <th className="text-right py-2 font-medium text-gray-700 w-24">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => {
              let snap: { name?: string; variantName?: string; sku?: string } = {};
              try { snap = JSON.parse(it.productSnapshot); } catch {}
              return (
                <tr key={it.id} className="border-b">
                  <td className="py-2.5">
                    <p className="font-medium">{snap.name ?? "Product"}</p>
                    <p className="text-xs text-gray-600">
                      {snap.variantName && `${snap.variantName} `}
                      {snap.sku && `· SKU ${snap.sku}`}
                    </p>
                  </td>
                  <td className="text-right py-2.5">{it.quantity}</td>
                  <td className="text-right py-2.5 font-mono">{formatCurrency(it.unitPrice, order.currency)}</td>
                  <td className="text-right py-2.5 font-mono">{formatCurrency(it.total, order.currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mt-4">
          <table className="text-sm">
            <tbody>
              <Row label="Subtotal" value={formatCurrency(order.subtotal, order.currency)} />
              {order.discountAmount > 0 && (
                <Row label={`Discount${order.coupon ? ` (${order.coupon.code})` : ""}`} value={`− ${formatCurrency(order.discountAmount, order.currency)}`} />
              )}
              <Row label="Tax" value={formatCurrency(order.taxAmount, order.currency)} />
              <Row label="Shipping" value={formatCurrency(order.shippingAmount, order.currency)} />
              <Row label="Total" value={formatCurrency(order.total, order.currency)} bold />
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-xs text-gray-600 text-center">
          <p>Thank you for your business.</p>
          {order.trackingNumber && <p className="mt-1">Tracking: {order.trackingNumber}</p>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr>
      <td className={`pr-8 py-1 text-gray-600 ${bold ? "font-semibold text-black" : ""}`}>{label}</td>
      <td className={`text-right font-mono py-1 w-32 ${bold ? "font-semibold text-base" : ""}`}>{value}</td>
    </tr>
  );
}

function AddressBlock({
  title,
  address,
  customerEmail,
}: {
  title: string;
  address: any;
  customerEmail?: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-1.5">{title}</p>
      {address ? (
        <address className="not-italic text-sm leading-6">
          <p className="font-medium">{[address.firstName, address.lastName].filter(Boolean).join(" ")}</p>
          <p>{address.line1}</p>
          {address.line2 && <p>{address.line2}</p>}
          <p>
            {address.city}, {address.state ? `${address.state} ` : ""}
            {address.postalCode}
          </p>
          <p>{address.country}</p>
          {customerEmail && <p className="text-xs text-gray-600 mt-1">{customerEmail}</p>}
        </address>
      ) : (
        <p className="text-sm text-gray-500 italic">Not provided.</p>
      )}
    </div>
  );
}
