import type { MetadataRoute } from "next";
import { listProducts, listCategories } from "@/lib/api-client";
import { SITE } from "@/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/$/, "");
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    "", "/shop", "/about", "/contact", "/faq", "/shipping", "/returns", "/privacy", "/terms", "/order",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const [products, categories] = await Promise.all([
      listProducts({ limit: 100 }),
      listCategories(),
    ]);
    const productPages: MetadataRoute.Sitemap = products.items.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: new Date(p.createdAt),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    const categoryPages: MetadataRoute.Sitemap = categories.items.map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
    return [...staticPages, ...categoryPages, ...productPages];
  } catch {
    return staticPages;
  }
}
