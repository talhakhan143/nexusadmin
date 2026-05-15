import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { verifyApiKey, withRateHeaders } from "@/server/api-auth";

/**
 * GET /api/public/v1/categories
 * Auth: Bearer <api_key>  ·  Scope: categories:read
 */
export async function GET(req: Request) {
  const ctx = await verifyApiKey(req, "categories:read");
  if (ctx instanceof Response) return ctx;

  const categories = await db.category.findMany({
    orderBy: { position: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      parentId: true,
      _count: { select: { products: true } },
    },
  });
  return withRateHeaders(NextResponse.json({ items: categories }), ctx);
}
