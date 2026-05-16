import { sendEmail } from "@/lib/email";

interface OrderEmailItem {
  name: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OrderEmailPayload {
  orderNumber: string;
  customerName: string | null;
  customerEmail: string;
  customerPhone?: string | null;
  items: OrderEmailItem[];
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  currency: string;
  paymentMethod: string;
  shippingAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    state?: string | null;
    country: string;
    postalCode: string;
  };
  notes?: string | null;
  storeName: string;
  trackingUrl?: string;
}

function fmt(amount: number, currency: string): string {
  if (currency === "PKR") {
    return `Rs ${Math.round(amount / 100).toLocaleString("en-PK")}`;
  }
  return `$${(amount / 100).toFixed(2)}`;
}

function itemRows(items: OrderEmailItem[], currency: string): string {
  return items
    .map(
      (it) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eee;">
            <div style="font-weight:600;color:#1a1a1a;">${escape(it.name)}</div>
            ${it.variantName ? `<div style="font-size:12px;color:#888;">${escape(it.variantName)}</div>` : ""}
            <div style="font-size:12px;color:#888;">Qty ${it.quantity} × ${fmt(it.unitPrice, currency)}</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500;">
            ${fmt(it.total, currency)}
          </td>
        </tr>`
    )
    .join("");
}

function escape(s: string): string {
  return s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]!));
}

// ── Customer-facing order confirmation ──
export async function sendOrderConfirmation(payload: OrderEmailPayload, to: string) {
  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
      <div style="text-align:center;padding:32px 0;border-bottom:1px solid #eee;">
        <h1 style="font-family:Georgia,serif;font-size:28px;margin:0;">${escape(payload.storeName)}</h1>
      </div>
      <div style="padding:32px 24px;">
        <h2 style="font-family:Georgia,serif;font-size:24px;margin:0 0 8px;">Thank you for your order!</h2>
        <p style="color:#666;font-size:14px;margin:0 0 24px;">Hi ${escape(payload.customerName ?? "there")}, we've received your order and we're getting it ready.</p>
        <div style="background:#f7f5f0;padding:20px;border-radius:4px;margin-bottom:24px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#888;">Order number</div>
          <div style="font-family:Georgia,serif;font-size:22px;margin-top:4px;">${escape(payload.orderNumber)}</div>
          <div style="font-size:12px;color:#666;margin-top:8px;">Payment method: <strong>${escape(payload.paymentMethod)}</strong></div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          ${itemRows(payload.items, payload.currency)}
        </table>
        <table style="width:100%;font-size:14px;">
          <tr><td>Subtotal</td><td style="text-align:right;">${fmt(payload.subtotal, payload.currency)}</td></tr>
          <tr><td>Shipping</td><td style="text-align:right;">${payload.shippingAmount === 0 ? "Free" : fmt(payload.shippingAmount, payload.currency)}</td></tr>
          ${payload.discountAmount > 0 ? `<tr><td>Discount</td><td style="text-align:right;color:#10b981;">- ${fmt(payload.discountAmount, payload.currency)}</td></tr>` : ""}
          ${payload.taxAmount > 0 ? `<tr><td>Tax</td><td style="text-align:right;">${fmt(payload.taxAmount, payload.currency)}</td></tr>` : ""}
          <tr style="font-weight:700;font-size:16px;border-top:2px solid #1a1a1a;"><td style="padding-top:12px;">Total</td><td style="padding-top:12px;text-align:right;">${fmt(payload.total, payload.currency)}</td></tr>
        </table>
        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #eee;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#888;">Shipping to</div>
          <div style="margin-top:8px;font-size:14px;line-height:1.6;">
            ${escape(payload.shippingAddress.line1)}<br>
            ${payload.shippingAddress.line2 ? escape(payload.shippingAddress.line2) + "<br>" : ""}
            ${escape(payload.shippingAddress.city)}, ${escape(payload.shippingAddress.postalCode)}<br>
            ${payload.shippingAddress.state ? escape(payload.shippingAddress.state) + ", " : ""}${escape(payload.shippingAddress.country)}
          </div>
        </div>
        ${payload.trackingUrl ? `<div style="margin-top:32px;text-align:center;"><a href="${payload.trackingUrl}" style="display:inline-block;background:#1a1a1a;color:white;padding:12px 32px;text-decoration:none;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;">Track your order</a></div>` : ""}
      </div>
      <div style="text-align:center;padding:24px;color:#888;font-size:12px;border-top:1px solid #eee;">
        Questions? Reply to this email — we read every message.
      </div>
    </div>`;
  return sendEmail({ to, subject: `Order ${payload.orderNumber} confirmed`, html });
}

// ── Admin-facing new-order notification ──
export async function sendNewOrderAlert(payload: OrderEmailPayload, to: string) {
  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
      <h2 style="font-family:Georgia,serif;">🛍️ New order received</h2>
      <p style="color:#666;">A new order has been placed on ${escape(payload.storeName)}.</p>
      <div style="background:#f7f5f0;padding:16px;border-radius:4px;margin:16px 0;">
        <div><strong>Order:</strong> ${escape(payload.orderNumber)}</div>
        <div><strong>Customer:</strong> ${escape(payload.customerName ?? payload.customerEmail)}</div>
        <div><strong>Email:</strong> <a href="mailto:${escape(payload.customerEmail)}">${escape(payload.customerEmail)}</a></div>
        ${payload.customerPhone ? `<div><strong>Phone:</strong> <a href="tel:${escape(payload.customerPhone)}">${escape(payload.customerPhone)}</a></div>` : ""}
        <div><strong>Total:</strong> ${fmt(payload.total, payload.currency)}</div>
        <div><strong>Payment:</strong> ${escape(payload.paymentMethod)}</div>
      </div>
      <h3>Items</h3>
      <table style="width:100%;border-collapse:collapse;">${itemRows(payload.items, payload.currency)}</table>
      <h3 style="margin-top:24px;">Ship to</h3>
      <div style="font-size:14px;line-height:1.6;">
        ${escape(payload.shippingAddress.line1)}<br>
        ${payload.shippingAddress.line2 ? escape(payload.shippingAddress.line2) + "<br>" : ""}
        ${escape(payload.shippingAddress.city)}, ${escape(payload.shippingAddress.postalCode)}<br>
        ${escape(payload.shippingAddress.country)}
      </div>
      ${payload.notes ? `<h3 style="margin-top:24px;">Customer note</h3><div style="font-style:italic;color:#666;">${escape(payload.notes)}</div>` : ""}
    </div>`;
  return sendEmail({ to, subject: `🛍️ New order ${payload.orderNumber} — ${fmt(payload.total, payload.currency)}`, html });
}
