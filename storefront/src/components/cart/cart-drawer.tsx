"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/store/cart";
import { formatPKR } from "@/lib/currency";
import { SITE } from "@/config/site";

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const remove = useCart((s) => s.remove);
  const setQty = useCart((s) => s.setQuantity);

  const freeShipLeft = Math.max(0, SITE.shipping.freeOver - subtotal);
  const progress = Math.min(100, (subtotal / SITE.shipping.freeOver) * 100);

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && close()}>
      <SheetContent side="right" className="p-0 flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-accent" />
            Your Cart
            <span className="text-sm font-normal text-muted-foreground">
              ({items.length} {items.length === 1 ? "item" : "items"})
            </span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-serif text-xl">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">Time to discover something beautiful.</p>
            </div>
            <Button onClick={close} asChild>
              <Link href="/shop">Continue shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="px-6 pt-4">
              {freeShipLeft > 0 ? (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Add <strong className="text-accent">{formatPKR(freeShipLeft)}</strong> more for free delivery.
                  </p>
                  <div className="mt-2 h-1 bg-secondary overflow-hidden">
                    <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-700 font-medium">✓ You qualify for free delivery.</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((it) => (
                <div key={it.variantId} className="flex gap-3 group">
                  <Link href={`/product/${it.productSlug}`} onClick={close} className="relative w-20 h-24 bg-secondary shrink-0">
                    {it.image ? (
                      <Image src={it.image} alt={it.productName} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${it.productSlug}`}
                      onClick={close}
                      className="font-medium text-sm hover:text-accent transition-colors line-clamp-2"
                    >
                      {it.productName}
                    </Link>
                    {it.variantName && (
                      <p className="text-xs text-muted-foreground mt-0.5">{it.variantName}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() => setQty(it.variantId, it.quantity - 1)}
                          className="p-1.5 hover:bg-secondary transition-colors"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{it.quantity}</span>
                        <button
                          onClick={() => setQty(it.variantId, it.quantity + 1)}
                          disabled={it.quantity >= it.maxStock}
                          className="p-1.5 hover:bg-secondary transition-colors disabled:opacity-30"
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm font-medium">{formatPKR(it.unitPrice * it.quantity)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(it.variantId)}
                    className="self-start p-1 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <Separator />

            <div className="p-6 space-y-3 bg-secondary/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPKR(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping & taxes calculated at checkout.</p>
              <Button asChild size="lg" className="w-full">
                <Link href="/checkout" onClick={close}>Checkout — {formatPKR(subtotal)}</Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={close} asChild>
                <Link href="/cart">View cart</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
