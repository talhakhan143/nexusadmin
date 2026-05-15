import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { verifyApiKey, withRateHeaders } from "@/server/api-auth";
import { bannerPlacementEnum } from "@/lib/validations/banner";

export const revalidate = 30;

/**
 * GET /api/public/v1/banners?placement=HOMEPAGE_HERO
 *           [&customKey=black-friday-strip]
 * Auth: Bearer <api_key>  ·  Scope: banners:read
 *
 * Returns active banners for the requested placement, sorted by `position`.
 * Filters out banners outside their startsAt/endsAt window automatically.
 *
 * Storefront design:
 *   - Each placement key is a stable contract.
 *   - The admin returns N banners; storefront chooses layout (carousel, grid, single).
 *   - For CUSTOM placement, pass &customKey=… to scope to a specific slot.
 */
export async function GET(req: Request) {
  const ctx = await verifyApiKey(req, "banners:read");
  if (ctx instanceof Response) return ctx;

  const url = new URL(req.url);
  const placementParam = url.searchParams.get("placement");
  const customKey = url.searchParams.get("customKey");

  if (!placementParam) {
    return NextResponse.json({ error: "?placement=… required" }, { status: 400 });
  }
  const parsed = bannerPlacementEnum.safeParse(placementParam);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `Invalid placement. Allowed: ${bannerPlacementEnum.options.join(", ")}`,
      },
      { status: 400 }
    );
  }
  if (parsed.data === "CUSTOM" && !customKey) {
    return NextResponse.json({ error: "&customKey=… required for placement=CUSTOM" }, { status: 400 });
  }

  const now = new Date();
  const banners = await db.banner.findMany({
    where: {
      placement: parsed.data,
      isActive: true,
      ...(parsed.data === "CUSTOM" && { customKey: customKey! }),
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    include: {
      targetCategory: { select: { slug: true, name: true } },
      targetProduct: { select: { slug: true, name: true } },
    },
  });

  const items = banners.map((b) => ({
    id: b.id,
    name: b.name,
    placement: b.placement,
    customKey: b.customKey,
    title: b.title,
    subtitle: b.subtitle,
    ctaText: b.ctaText,
    ctaUrl: b.ctaUrl,
    image: b.image,
    imageMobile: b.imageMobile,
    alt: b.alt,
    bgColor: b.bgColor,
    textColor: b.textColor,
    linkUrl: b.linkUrl,
    targetCategory: b.targetCategory,
    targetProduct: b.targetProduct,
    position: b.position,
  }));

  return withRateHeaders(NextResponse.json({ items }), ctx);
}
