import Link from "next/link";
import { CheckCircle2, ArrowRight, Mail, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Order placed" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; email?: string }>;
}) {
  const sp = await searchParams;
  const orderNumber = sp.order ?? "—";

  return (
    <div className="container-tight py-20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-700" />
        </div>
        <h1 className="font-serif text-4xl md:text-5xl">Thank you for your order.</h1>
        <p className="mt-4 text-muted-foreground">
          Your order has been placed and we're getting it ready.
        </p>

        <div className="mt-10 bg-secondary/40 border p-8 text-left">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Order number</p>
          <p className="font-serif text-2xl mt-1 select-all">{orderNumber}</p>
          <hr className="my-5 border-border" />
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <Mail className="h-4 w-4 mt-0.5 text-accent shrink-0" />
              <span>A confirmation email is on its way to <strong>{sp.email}</strong>.</span>
            </li>
            <li className="flex gap-3">
              <Truck className="h-4 w-4 mt-0.5 text-accent shrink-0" />
              <span>Standard delivery is <strong>3–5 working days</strong>. We'll send tracking once shipped.</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          {sp.email && (
            <Button asChild>
              <Link href={`/order/${orderNumber}?email=${encodeURIComponent(sp.email)}`}>
                Track order <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
