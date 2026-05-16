"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Truck, CreditCard, Wallet, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/store/cart";
import { formatPKR } from "@/lib/currency";
import { placeOrderAction } from "@/server/actions";
import { SITE } from "@/config/site";
import { cn } from "@/lib/cn";

const PK_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan",
  "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad", "Bahawalpur",
  "Sargodha", "Sukkur", "Larkana", "Mardan", "Abbottabad", "Mirpur", "Other",
];

type PaymentMethod = "COD" | "JAZZCASH" | "EASYPAISA" | "CARD";

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; description: string; icon: React.ComponentType<{ className?: string }>; surcharge?: number }[] = [
  { id: "COD", label: "Cash on Delivery", description: "Pay when your order arrives at your doorstep.", icon: Banknote },
  { id: "JAZZCASH", label: "JazzCash", description: "Pay securely with your JazzCash mobile wallet.", icon: Wallet },
  { id: "EASYPAISA", label: "Easypaisa", description: "Pay securely with your Easypaisa mobile wallet.", icon: Wallet },
  { id: "CARD", label: "Debit / Credit Card", description: "Visa, Mastercard. Encrypted payment.", icon: CreditCard },
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);

  const [submitting, setSubmitting] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("COD");
  const [coupon, setCoupon] = React.useState("");
  const [couponApplied, setCouponApplied] = React.useState(false);
  const [form, setForm] = React.useState({
    email: "", phone: "", firstName: "", lastName: "",
    line1: "", line2: "", city: "", state: "", postalCode: "",
    notes: "", acceptsMarketing: true,
  });

  const shippingAmount = subtotal >= SITE.shipping.freeOver ? 0 : 25000; // Rs 250
  const total = subtotal + shippingAmount;

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);

    const res = await placeOrderAction({
      customer: {
        email: form.email,
        name: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone,
        acceptsMarketing: form.acceptsMarketing,
      },
      items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      shippingAddress: {
        firstName: form.firstName,
        lastName: form.lastName,
        line1: form.line1,
        line2: form.line2 || undefined,
        city: form.city,
        state: form.state || undefined,
        country: "Pakistan",
        postalCode: form.postalCode,
        phone: form.phone,
      },
      shippingAmount,
      couponCode: couponApplied ? coupon : null,
      notes: form.notes || null,
      paymentMethod,
    });

    setSubmitting(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    // For COD: order placed, go to success
    // For JazzCash/Easypaisa/Card: backend will return checkoutUrl when wired; for now go to success
    if (res.data.checkoutUrl) {
      window.location.href = res.data.checkoutUrl;
      return;
    }

    clear();
    router.push(`/checkout/success?order=${res.data.orderNumber}&email=${encodeURIComponent(form.email)}`);
  }

  if (items.length === 0) {
    return (
      <div className="container-tight py-20 text-center">
        <h1 className="font-serif text-3xl mb-4">Your cart is empty.</h1>
        <Button asChild>
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-tight py-10 md:py-16">
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl md:text-4xl">Checkout</h1>
        <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
          <Lock className="h-3.5 w-3.5" /> Secure checkout — your data is encrypted.
        </p>
      </div>

      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_400px] gap-10 lg:gap-16">
        <div className="space-y-10">
          {/* Contact */}
          <Section title="Contact" subtitle="So we can send order updates.">
            <Field label="Email" required>
              <Input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Phone" required>
              <Input type="tel" required value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="03XX-XXXXXXX" />
            </Field>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.acceptsMarketing}
                onChange={(e) => update("acceptsMarketing", e.target.checked)}
                className="accent-accent h-4 w-4"
              />
              <span>Email me with news and offers.</span>
            </label>
          </Section>

          {/* Delivery */}
          <Section title="Delivery" subtitle="Where should we send your order?">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" required>
                <Input required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
              </Field>
              <Field label="Last name">
                <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
              </Field>
            </div>
            <Field label="Address" required>
              <Input required value={form.line1} onChange={(e) => update("line1", e.target.value)} placeholder="House #, street" />
            </Field>
            <Field label="Apartment, area (optional)">
              <Input value={form.line2} onChange={(e) => update("line2", e.target.value)} placeholder="Block B, DHA Phase 5" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" required>
                <select
                  required
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="flex h-11 w-full border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select city</option>
                  {PK_CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Postal code" required>
                <Input required value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} placeholder="74000" />
              </Field>
            </div>
            <Field label="Province / State">
              <Input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="Sindh" />
            </Field>
            <div className="bg-secondary/40 border p-4 flex gap-3 items-center text-sm">
              <Truck className="h-4 w-4 text-accent shrink-0" />
              <p>
                Standard delivery: <strong>{SITE.shipping.standardDays}</strong>. Express (major cities): <strong>{SITE.shipping.expressDays}</strong>.
              </p>
            </div>
          </Section>

          {/* Payment */}
          <Section title="Payment" subtitle="All transactions are secure and encrypted.">
            <div className="space-y-2">
              {PAYMENT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = paymentMethod === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex gap-3 p-4 border cursor-pointer transition-all",
                      isActive ? "border-accent bg-accent/5" : "border-border hover:border-foreground"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={opt.id}
                      checked={isActive}
                      onChange={() => setPaymentMethod(opt.id)}
                      className="mt-1 accent-accent"
                    />
                    <Icon className="h-5 w-5 mt-0.5 text-accent" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            {paymentMethod !== "COD" && (
              <p className="text-xs text-muted-foreground bg-secondary/40 p-3 border">
                You will be redirected to {paymentMethod === "CARD" ? "the secure card processor" : paymentMethod} to complete payment after placing your order.
              </p>
            )}
          </Section>

          {/* Notes */}
          <Section title="Order notes" subtitle="Optional — gift message, delivery instructions, etc.">
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="flex w-full border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Leave at the gate, ring the bell once…"
            />
          </Section>
        </div>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-24 self-start">
          <div className="bg-secondary/40 border p-6 space-y-4">
            <h3 className="font-serif text-xl">Order summary</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {items.map((it) => (
                <div key={it.variantId} className="flex gap-3">
                  <div className="relative w-16 h-20 bg-secondary shrink-0">
                    {it.image && <Image src={it.image} alt={it.productName} fill className="object-cover" sizes="64px" />}
                    <span className="absolute -top-2 -right-2 h-5 w-5 bg-accent text-accent-foreground text-xs flex items-center justify-center rounded-full">
                      {it.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{it.productName}</p>
                    {it.variantName && <p className="text-xs text-muted-foreground">{it.variantName}</p>}
                  </div>
                  <p className="text-sm font-medium tabular-nums">{formatPKR(it.unitPrice * it.quantity)}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Coupon */}
            <div className="flex gap-2">
              <Input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="Promo code"
                disabled={couponApplied}
              />
              <Button
                type="button"
                variant={couponApplied ? "outline" : "secondary"}
                onClick={() => coupon && setCouponApplied(!couponApplied)}
              >
                {couponApplied ? "Remove" : "Apply"}
              </Button>
            </div>
            {couponApplied && (
              <p className="text-xs text-emerald-700">Coupon <strong>{coupon}</strong> will be validated at order placement.</p>
            )}

            <Separator />

            <div className="space-y-2 text-sm">
              <Row label="Subtotal" value={formatPKR(subtotal)} />
              <Row
                label="Shipping"
                value={shippingAmount === 0 ? "Free" : formatPKR(shippingAmount)}
              />
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-medium font-serif">
              <span>Total</span>
              <span>{formatPKR(total)}</span>
            </div>

            <Button type="submit" size="lg" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Placing order…" : `Place order — ${formatPKR(total)}`}
            </Button>

            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              By placing this order, you agree to our{" "}
              <Link href="/terms" className="link-underline">Terms</Link> and{" "}
              <Link href="/privacy" className="link-underline">Privacy Policy</Link>.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
