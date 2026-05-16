import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, listProducts } from "@/lib/api-client";
import { ProductGallery } from "@/components/product/product-gallery";
import { BuyBox } from "@/components/product/buy-box";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "@/components/home/section-heading";
import { ApiError } from "@/lib/api-client";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await getProduct(slug);
    return {
      title: p.metaTitle ?? p.name,
      description: p.metaDescription ?? p.description ?? undefined,
      openGraph: {
        title: p.name,
        description: p.description ?? undefined,
        images: p.images[0] ? [{ url: p.images[0].url }] : undefined,
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product;
  try {
    product = await getProduct(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const related = product.category
    ? await listProducts({ limit: 4, category: product.category.slug }).catch(() => ({ items: [], nextCursor: null }))
    : { items: [], nextCursor: null };

  const relatedItems = related.items.filter((r) => r.id !== product.id).slice(0, 4);

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="border-b">
        <div className="container-tight py-4 text-xs uppercase tracking-wider text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link> /{" "}
          <Link href="/shop" className="hover:text-foreground">Shop</Link>
          {product.category && (
            <>
              {" / "}
              <Link href={`/category/${product.category.slug}`} className="hover:text-foreground">
                {product.category.name}
              </Link>
            </>
          )}
          {" / "}
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      <div className="container-tight py-10 md:py-16 grid md:grid-cols-2 gap-10 md:gap-16">
        <ProductGallery images={product.images} name={product.name} />
        <BuyBox product={product} />
      </div>

      {/* Description block */}
      {product.description && (
        <section className="border-t bg-secondary/30">
          <div className="container-tight py-16 grid md:grid-cols-3 gap-10">
            <div>
              <p className="section-eyebrow">Details</p>
              <h2 className="font-serif text-3xl mt-4">The story.</h2>
            </div>
            <div className="md:col-span-2 prose prose-stone max-w-none text-base leading-relaxed text-muted-foreground">
              <p>{product.description}</p>
            </div>
          </div>
        </section>
      )}

      {/* Related */}
      {relatedItems.length > 0 && (
        <section className="container-tight py-16 md:py-24">
          <SectionHeading
            eyebrow="You may also like"
            title="More from this collection."
            className="mb-10"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
            {relatedItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
