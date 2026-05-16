"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { formatPKR, discountPercent } from "@/lib/currency";
import { cn } from "@/lib/cn";
import type { ApiProductListItem } from "@/types/api";

export function ProductCard({ product }: { product: ApiProductListItem }) {
  const add = useCart((s) => s.add);
  const img = product.images[0]?.url ?? null;
  const lowestVariant = product.variants
    .filter((v) => v.stock > 0)
    .reduce((min, v) => (min === null || v.price < min.price ? v : min), null as null | typeof product.variants[number]);

  const price = lowestVariant?.price ?? product.basePrice;
  const compare = product.compareAtPrice ?? null;
  const disc = compare ? discountPercent(compare, price) : 0;
  const outOfStock = !lowestVariant;

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!lowestVariant) return;
    add({
      variantId: lowestVariant.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantName: lowestVariant.name ?? null,
      image: img,
      unitPrice: lowestVariant.price,
      compareAtPrice: compare,
      maxStock: lowestVariant.stock,
    });
    toast.success("Added to cart", { description: product.name });
  }

  return (
    <article className="group">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="product-img-wrap aspect-[4/5] mb-4">
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              sizes="(max-width:768px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <span className="text-xs uppercase tracking-wider">No image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {disc > 0 && <Badge variant="sale">-{disc}%</Badge>}
            {product.category && <Badge variant="soft" className="opacity-90">{product.category.name}</Badge>}
            {outOfStock && <Badge variant="default">Sold out</Badge>}
          </div>

          {/* Hover actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
            <button
              aria-label="Wishlist"
              className="p-2 bg-background/90 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              <Heart className="h-3.5 w-3.5" />
            </button>
            <button
              aria-label="Quick view"
              className="p-2 bg-background/90 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Bottom add button */}
          {!outOfStock && (
            <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              <Button onClick={quickAdd} size="sm" className="w-full">
                <ShoppingBag className="h-3.5 w-3.5" />
                Add to cart
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="font-serif text-base md:text-lg leading-tight group-hover:text-accent transition-colors line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className={cn("font-medium", disc > 0 && "price-sale")}>{formatPKR(price)}</span>
            {compare && compare > price && (
              <span className="price-strike">{formatPKR(compare)}</span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-[4/5] bg-secondary animate-pulse" />
      <div className="h-4 bg-secondary animate-pulse w-3/4" />
      <div className="h-4 bg-secondary animate-pulse w-1/3" />
    </div>
  );
}
