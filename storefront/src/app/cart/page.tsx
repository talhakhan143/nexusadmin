"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/store/cart";
import { formatPKR } from "@/lib/currency";
import { SITE } from "@/config/site";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const remove = useCart((s) => s.remove);
  const setQty = useCart((s) => s.setQuantity);

  const freeShipLeft = Math.max(0, SITE.shipping.freeOver - subtotal);

  return (
    <div className="container-tight py-12 md:py-20">
      <h1 className="font-serif text-4xl md:text-5xl mb-2">Your Cart</h1>
      <p className="text-muted-foreground mb-10">
        {items.length === 0 ? "Your cart is empty." : `${items.length} item${items.length === 1 ? "" : "s"} in your bag.`}
      </p>

      {items.length === 0 ? (
        <div className="border border-dashed py-20 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="font-serif text-2xl">Discover something beautiful.</p>
          <Button asChild className="mt-6">
            <Link href="/shop">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-10">
          {/* Items */}
          <div className="space-y-4">
            <div className="hidden md:grid grid-cols-[1fr_120px_120px_40px] gap-4 pb-3 border-b text-xs uppercase tracking-wider text-muted-foreground">
              <div>Product</div>
              <div>Quantity</div>
              <div className="text-right">Total</div>
              <div />
            </div>

            {items.map((it) => (
              <div key={it.variantId} className="grid grid-cols-[80px_1fr] md:grid-cols-[1fr_120px_120px_40px] gap-4 py-4 border-b items-center">
                <Link href={`/product/${it.productSlug}`} className="flex gap-4 items-center md:col-span-1 col-span-2">
                  <div className="relative w-20 h-24 bg-secondary shrink-0">
                    {it.image && <Image src={it.image} alt={it.productName} fill className="object-cover" sizes="80px" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium hover:text-accent transition-colors">{it.productName}</p>
                    {it.variantName && <p className="text-sm text-muted-foreground mt-1">{it.variantName}</p>}
                    <p className="text-sm mt-1">{formatPKR(it.unitPrice)}</p>
                  </div>
                </Link>

                <div className="flex items-center border border-border w-fit md:w-auto md:max-w-[120px]">
                  <button onClick={() => setQty(it.variantId, it.quantity - 1)} className="p-2 hover:bg-secondary" aria-label="Decrease">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm">{it.quantity}</span>
                  <button
                    onClick={() => setQty(it.variantId, it.quantity + 1)}
                    disabled={it.quantity >= it.maxStock}
                    className="p-2 hover:bg-secondary disabled:opacity-30"
                    aria-label="Increase"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <p className="font-medium text-right">{formatPKR(it.unitPrice * it.quantity)}</p>

                <button
                  onClick={() => remove(it.variantId)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 justify-self-end"
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <aside className="self-start lg:sticky lg:top-24">
            <div className="bg-secondary/40 border p-6 space-y-4">
              <h3 className="font-serif text-xl">Order Summary</h3>

              {freeShipLeft > 0 ? (
                <div className="bg-background border p-3 text-xs">
                  <p>Add <strong className="text-accent">{formatPKR(freeShipLeft)}</strong> more for free delivery.</p>
                  <div className="mt-2 h-1 bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${Math.min(100, (subtotal / SITE.shipping.freeOver) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-700 font-medium">✓ You qualify for free delivery.</p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPKR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-xs">Calculated at checkout</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-base font-medium">
                <span>Total</span>
                <span>{formatPKR(subtotal)}</span>
              </div>

              <Button asChild size="lg" className="w-full">
                <Link href="/checkout">
                  Proceed to checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button variant="outline" size="lg" className="w-full" asChild>
                <Link href="/shop">Continue shopping</Link>
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
