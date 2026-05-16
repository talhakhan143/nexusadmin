import { listBanners, listCategories, listProducts } from "@/lib/api-client";
import { Hero } from "@/components/home/hero";
import { CategoryCards } from "@/components/home/category-cards";
import { ProductGrid } from "@/components/home/product-grid";
import { FeaturesStrip } from "@/components/home/features-strip";
import { AboutBlock } from "@/components/home/about-block";
import { SaleBanner } from "@/components/home/sale-banner";
import { Testimonials } from "@/components/home/testimonials";
import { InstagramStrip } from "@/components/home/instagram-strip";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.warn("[home] API call failed, using fallback:", (e as Error).message);
    return fallback;
  }
}

export default async function HomePage() {
  const [heroBanners, secondaryBanners, categoriesRes, bestsellersRes, newArrivalsRes] = await Promise.all([
    safe(() => listBanners("HOMEPAGE_HERO").then((r) => r.items), []),
    safe(() => listBanners("HOMEPAGE_SECONDARY").then((r) => r.items), []),
    safe(() => listCategories(), { items: [] }),
    safe(() => listProducts({ limit: 8 }), { items: [], nextCursor: null }),
    safe(() => listProducts({ limit: 8 }), { items: [], nextCursor: null }),
  ]);

  return (
    <>
      <Hero banners={heroBanners} />
      <CategoryCards categories={categoriesRes.items} />
      <ProductGrid
        eyebrow="Best sellers"
        title="The community's favourites."
        subtitle="Our most-loved fragrances, attars, and beauty essentials — chosen by you."
        products={bestsellersRes.items}
        ctaHref="/shop?sort=best"
        ctaLabel="Shop all"
      />
      <FeaturesStrip />
      <AboutBlock />
      <SaleBanner />
      <ProductGrid
        eyebrow="Just landed"
        title="New arrivals."
        subtitle="Fresh releases from our atelier — small batches, hand-bottled."
        products={newArrivalsRes.items}
        ctaHref="/shop?sort=new"
        ctaLabel="See all new"
      />
      <Testimonials />
      <InstagramStrip />
    </>
  );
}
