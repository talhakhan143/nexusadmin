"use client";

import * as React from "react";
import { Heart, Minus, Plus, ShoppingBag, Truck, ShieldCheck, RefreshCcw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/store/cart";
import { formatPKR, discountPercent } from "@/lib/currency";
import { cn } from "@/lib/cn";
import type { ApiProductDetail, ApiVariantFull } from "@/types/api";

export function BuyBox({ product }: { product: ApiProductDetail }) {
  const add = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);
  const [qty, setQty] = React.useState(1);

  // Group variant options by name (e.g. Size: 50ml/100ml, Color: Red/Gold)
  const optionsByName = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    product.variants.forEach((v) => {
      v.options.forEach((o) => {
        if (!map.has(o.name)) map.set(o.name, new Set());
        map.get(o.name)!.add(o.value);
      });
    });
    return Array.from(map.entries()).map(([name, values]) => ({ name, values: Array.from(values) }));
  }, [product.variants]);

  const [selected, setSelected] = React.useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    optionsByName.forEach((opt) => {
      init[opt.name] = opt.values[0];
    });
    return init;
  });

  const matchedVariant: ApiVariantFull | null = React.useMemo(() => {
    if (product.variants.length === 0) return null;
    if (optionsByName.length === 0) return product.variants[0];
    return (
      product.variants.find((v) =>
        v.options.every((o) => selected[o.name] === o.value)
      ) ?? null
    );
  }, [product.variants, optionsByName, selected]);

  const price = matchedVariant?.price ?? product.basePrice;
  const compare = matchedVariant?.compareAtPrice ?? product.compareAtPrice ?? null;
  const disc = compare ? discountPercent(compare, price) : 0;
  const inStock = matchedVariant ? matchedVariant.stock > 0 : false;
  const stockLeft = matchedVariant?.stock ?? 0;

  function handleAdd() {
    if (!matchedVariant) {
      toast.error("Please select all options");
      return;
    }
    if (!inStock) return;
    add({
      variantId: matchedVariant.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantName: matchedVariant.name ?? matchedVariant.options.map((o) => o.value).join(" · "),
      image: product.images[0]?.url ?? null,
      unitPrice: matchedVariant.price,
      compareAtPrice: matchedVariant.compareAtPrice ?? null,
      maxStock: matchedVariant.stock,
    }, qty);
    toast.success("Added to cart", { description: product.name });
  }

  function buyNow() {
    handleAdd();
    openCart();
  }

  return (
    <div className="space-y-6">
      {/* Category + title */}
      <div className="space-y-3">
        {product.category && (
          <p className="section-eyebrow">{product.category.name}</p>
        )}
        <h1 className="font-serif text-3xl md:text-5xl leading-tight">{product.name}</h1>
        <div className="flex items-baseline gap-3">
          <span className={cn("text-3xl font-serif", disc > 0 && "text-destructive")}>{formatPKR(price)}</span>
          {compare && compare > price && (
            <>
              <span className="price-strike text-lg">{formatPKR(compare)}</span>
              <Badge variant="sale">Save {disc}%</Badge>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Tax included. Shipping calculated at checkout.</p>
      </div>

      {product.description && (
        <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>
      )}

      <Separator />

      {/* Variant selectors */}
      {optionsByName.map((opt) => (
        <div key={opt.name}>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            {opt.name}: <span className="text-foreground font-medium normal-case tracking-normal">{selected[opt.name]}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {opt.values.map((v) => {
              const isActive = selected[opt.name] === v;
              return (
                <button
                  key={v}
                  onClick={() => setSelected({ ...selected, [opt.name]: v })}
                  className={cn(
                    "px-4 py-2 border text-sm transition-all",
                    isActive
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border hover:border-foreground"
                  )}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Stock indicator */}
      {inStock ? (
        <p className="text-xs text-emerald-700 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-700" />
          In stock {stockLeft <= 5 && `— only ${stockLeft} left`}
        </p>
      ) : (
        <p className="text-xs text-destructive flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          Sold out
        </p>
      )}

      {/* Qty + add to cart */}
      <div className="flex items-stretch gap-3">
        <div className="flex items-center border border-border">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-3 hover:bg-secondary" aria-label="Decrease">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-12 text-center font-medium tabular-nums">{qty}</span>
          <button
            onClick={() => setQty(Math.min(stockLeft, qty + 1))}
            disabled={qty >= stockLeft}
            className="px-4 py-3 hover:bg-secondary disabled:opacity-30"
            aria-label="Increase"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <Button onClick={handleAdd} disabled={!inStock} size="lg" className="flex-1">
          <ShoppingBag className="h-4 w-4" />
          Add to cart
        </Button>
        <Button variant="outline" size="lg" className="px-4" aria-label="Wishlist">
          <Heart className="h-4 w-4" />
        </Button>
      </div>

      <Button onClick={buyNow} disabled={!inStock} variant="gold" size="lg" className="w-full">
        Buy it now — {formatPKR(price * qty)}
      </Button>

      <Separator />

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-4 pt-2">
        <Trust icon={Truck} label="Free over Rs 3,500" />
        <Trust icon={ShieldCheck} label="100% authentic" />
        <Trust icon={RefreshCcw} label="7-day returns" />
      </div>

      {/* Share */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-4">
        <Share2 className="h-3.5 w-3.5" />
        <span>Share:</span>
        <a href="#" className="link-underline">WhatsApp</a>
        <a href="#" className="link-underline">Facebook</a>
        <a href="#" className="link-underline">Copy link</a>
      </div>
    </div>
  );
}

function Trust({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <Icon className="h-4 w-4 text-accent" />
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
