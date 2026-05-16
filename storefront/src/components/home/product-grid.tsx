import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "./section-heading";
import type { ApiProductListItem } from "@/types/api";

export function ProductGrid({
  products,
  eyebrow,
  title,
  subtitle,
  ctaHref = "/shop",
  ctaLabel = "View all",
}: {
  products: ApiProductListItem[];
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <section className="container-tight py-16 md:py-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <Link
          href={ctaHref}
          className="link-underline text-sm uppercase tracking-wider self-start md:self-end flex items-center gap-2 group"
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p>No products yet. <Link href="/shop" className="link-underline">Browse shop</Link>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
