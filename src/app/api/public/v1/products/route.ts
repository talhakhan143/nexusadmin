import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { verifyApiKey, withRateHeaders } from "@/server/api-auth";

/**
 * GET /api/public/v1/products?limit=20&cursor=<id>&category=<slug>
 * Auth: Bearer <api_key>  ·  Scope: products:read
 */
export async function GET(req: Request) {
  const ctx = await verifyApiKey(req, "products:read");
  if (ctx instanceof Response) return ctx;

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 100);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const category = url.searchParams.get("category");

  const products = await db.product.findMany({
    where: {
      status: "ACTIVE",
      ...(category && { category: { slug: category } }),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      category: { select: { name: true, slug: true } },
      variants: { select: { id: true, name: true, price: true, stock: true } },
    },
  });

  const hasMore = products.length > limit;
  const items = hasMore ? products.slice(0, limit) : products;

  return withRateHeaders(
    NextResponse.json({
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    }),
    ctx
  );
}
