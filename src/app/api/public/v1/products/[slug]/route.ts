import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { verifyApiKey, withRateHeaders } from "@/server/api-auth";

/**
 * GET /api/public/v1/products/:slug — full product detail with images + variants.
 * Auth: Bearer <api_key>  ·  Scope: products:read
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ctx = await verifyApiKey(req, "products:read");
  if (ctx instanceof Response) return ctx;

  const { slug } = await params;
  const product = await db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      images: { orderBy: { position: "asc" } },
      category: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: { select: { name: true, slug: true } } } },
      variants: {
        orderBy: { position: "asc" },
        include: { options: true },
      },
    },
  });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return withRateHeaders(
    NextResponse.json({
      ...product,
      tags: product.tags.map((t) => t.tag),
    }),
    ctx
  );
}
