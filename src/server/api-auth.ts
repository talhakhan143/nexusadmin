import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";

export interface AuthContext {
  apiKeyId: string;
  scopes: string[];
}

/** In-memory rate-limit bucket. Resets on dev restart; replace with Redis in prod. */
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_PER_MINUTE = 120;

function rateLimitOk(keyId: string): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = rateBuckets.get(keyId);
  if (!bucket || now > bucket.resetAt) {
    const fresh = { count: 1, resetAt: now + 60_000 };
    rateBuckets.set(keyId, fresh);
    return { ok: true, remaining: RATE_LIMIT_PER_MINUTE - 1, resetAt: fresh.resetAt };
  }
  bucket.count++;
  if (bucket.count > RATE_LIMIT_PER_MINUTE) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }
  return { ok: true, remaining: RATE_LIMIT_PER_MINUTE - bucket.count, resetAt: bucket.resetAt };
}

/**
 * Verify a Bearer-token request. Looks up by prefix (indexed) then bcrypt-compares
 * the full key. Enforces scope, expiry and rate limit.
 *
 * Returns either the auth context, or a Response to short-circuit the handler with.
 */
export async function verifyApiKey(req: Request, requiredScope: string): Promise<AuthContext | Response> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
  }
  const token = match[1].trim();
  if (token.length < 16) {
    return NextResponse.json({ error: "Invalid token format" }, { status: 401 });
  }

  const prefix = token.slice(0, 12);
  const candidates = await db.apiKey.findMany({ where: { prefix } });
  if (candidates.length === 0) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  let matched: typeof candidates[number] | null = null;
  for (const c of candidates) {
    if (await bcrypt.compare(token, c.hashedKey)) {
      matched = c;
      break;
    }
  }
  if (!matched) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (matched.expiresAt && matched.expiresAt < new Date()) {
    return NextResponse.json({ error: "API key expired" }, { status: 401 });
  }

  let scopes: string[] = [];
  try { scopes = JSON.parse(matched.scopes); } catch {}
  if (!scopes.includes(requiredScope)) {
    return NextResponse.json(
      { error: `Missing scope "${requiredScope}". Granted: ${scopes.join(", ") || "none"}` },
      { status: 403 }
    );
  }

  const limit = rateLimitOk(matched.id);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT_PER_MINUTE),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(limit.resetAt / 1000)),
          "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // Best-effort lastUsedAt update (don't await to keep latency low)
  void db.apiKey.update({ where: { id: matched.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return { apiKeyId: matched.id, scopes };
}

/** Helper to attach rate-limit headers to a successful response. */
export function withRateHeaders(res: NextResponse, ctx: AuthContext): NextResponse {
  const bucket = rateBuckets.get(ctx.apiKeyId);
  if (bucket) {
    res.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_PER_MINUTE));
    res.headers.set("X-RateLimit-Remaining", String(Math.max(0, RATE_LIMIT_PER_MINUTE - bucket.count)));
    res.headers.set("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
  }
  return res;
}
