import Link from "next/link";
import { listProducts, listCategories } from "@/lib/api-client";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "@/components/home/section-heading";
import { cn } from "@/lib/cn";

export const metadata = { title: "Shop" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const [productsRes, categoriesRes] = await Promise.all([
    listProducts({ limit: 24, category: sp.category }).catch(() => ({ items: [], nextCursor: null })),
    listCategories().catch(() => ({ items: [] })),
  ]);

  return (
    <div>
      {/* Header */}
      <section className="bg-secondary/40 border-b">
        <div className="container-tight py-14 md:py-20">
          <nav className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
            <Link href="/" className="hover:text-foreground">Home</Link> / <span>Shop</span>
          </nav>
          <SectionHeading
            eyebrow={sp.category ?? "All products"}
            title={sp.q ? `Results for "${sp.q}"` : sp.category ? `${sp.category}` : "The full collection"}
            subtitle="Filter by category. Sort by what matters to you."
          />
        </div>
      </section>

      <div className="container-tight py-12 md:py-16 grid lg:grid-cols-[240px_1fr] gap-10">
        {/* Sidebar */}
        <aside className="space-y-8 lg:sticky lg:top-24 self-start">
          <div>
            <h3 className="font-serif text-lg mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/shop"
                  className={cn(
                    "text-sm hover:text-accent transition-colors",
                    !sp.category && "font-medium text-accent"
                  )}
                >
                  All products
                </Link>
              </li>
              {categoriesRes.items.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/shop?category=${c.slug}`}
                    className={cn(
                      "text-sm hover:text-accent transition-colors flex items-center justify-between",
                      sp.category === c.slug && "font-medium text-accent"
                    )}
                  >
                    {c.name}
                    <span className="text-xs text-muted-foreground">{c._count.products}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-lg mb-4">Sort</h3>
            <ul className="space-y-2 text-sm">
              {[
                { v: "new", label: "Newest first" },
                { v: "best", label: "Best sellers" },
                { v: "price-asc", label: "Price: low to high" },
                { v: "price-desc", label: "Price: high to low" },
              ].map((s) => (
                <li key={s.v}>
                  <Link
                    href={`/shop?${new URLSearchParams({ ...sp, sort: s.v }).toString()}`}
                    className={cn(
                      "hover:text-accent transition-colors",
                      sp.sort === s.v && "font-medium text-accent"
                    )}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Grid */}
        <div>
          {productsRes.items.length === 0 ? (
            <div className="border border-dashed py-20 text-center">
              <p className="font-serif text-2xl">No products yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add products in the admin panel to populate the store.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Showing {productsRes.items.length} products
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10">
                {productsRes.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
