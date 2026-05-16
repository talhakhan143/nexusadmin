import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { verifyApiKey, withRateHeaders } from "@/server/api-auth";

/**
 * GET /api/public/v1/store
 * Auth: Bearer <api_key> · Scope: products:read (basic read)
 *
 * Returns the single Store record — name, contact info, currency,
 * address, social links. Used by the storefront to render contact
 * pages and footer without hard-coding.
 */
export async function GET(req: Request) {
  const ctx = await verifyApiKey(req, "products:read");
  if (ctx instanceof Response) return ctx;

  const store = await db.store.findFirst();
  if (!store) {
    return NextResponse.json({ error: "Store not configured" }, { status: 404 });
  }

  return withRateHeaders(
    NextResponse.json({
      name: store.name,
      legalName: store.legalName,
      email: store.email,
      phone: store.phone,
      logo: store.logo,
      currency: store.currency,
      locale: store.locale,
      timezone: store.timezone,
      country: store.country,
      city: store.city,
      state: store.state,
      addressLine1: store.addressLine1,
      addressLine2: store.addressLine2,
      postalCode: store.postalCode,
      socialInstagram: store.socialInstagram,
      socialFacebook: store.socialFacebook,
      socialTwitter: store.socialTwitter,
    }),
    ctx
  );
}
