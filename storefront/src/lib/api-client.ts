/**
 * Typed wrapper around NexusAdmin public REST API.
 * All fetches are server-side — API key never reaches the browser.
 *
 * To use from a client component, wrap calls in a Server Action or route handler.
 */
import "server-only";
import type {
  ApiBanner,
  ApiCategory,
  ApiCheckoutPayload,
  ApiCheckoutResponse,
  ApiOrderDetail,
  ApiProductDetail,
  ApiProductListItem,
  ApiStore,
  BannerPlacement,
} from "@/types/api";

const BASE = process.env.ADMIN_API_URL;
const KEY = process.env.ADMIN_API_KEY;

if (!BASE || !KEY) {
  // Soft-fail at runtime, not import time, so build doesn't break before envs are set.
  console.warn("[api-client] ADMIN_API_URL or ADMIN_API_KEY not set — calls will fail.");
}

type FetchOpts = {
  /** Next.js ISR revalidation seconds. 0 = no cache. */
  revalidate?: number;
  tags?: string[];
  signal?: AbortSignal;
};

async function get<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json" },
    next: { revalidate: opts.revalidate ?? 60, tags: opts.tags },
    signal: opts.signal,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || res.statusText, url);
  }
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, json?.error ?? res.statusText, url, json);
  }
  return json as T;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public url: string, public data?: unknown) {
    super(`[${status}] ${message} (${url})`);
    this.name = "ApiError";
  }
}

// ── Products ──────────────────────────────────────────────────────────────

export async function listProducts(params: {
  limit?: number;
  cursor?: string;
  category?: string;
} = {}): Promise<{ items: ApiProductListItem[]; nextCursor: string | null }> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.cursor) qs.set("cursor", params.cursor);
  if (params.category) qs.set("category", params.category);
  const suffix = qs.toString() ? `?${qs}` : "";
  return get(`/products${suffix}`, { revalidate: 120, tags: ["products"] });
}

export async function getProduct(slug: string): Promise<ApiProductDetail> {
  return get(`/products/${encodeURIComponent(slug)}`, {
    revalidate: 300,
    tags: [`product:${slug}`, "products"],
  });
}

// ── Categories ────────────────────────────────────────────────────────────

export async function listCategories(): Promise<{ items: ApiCategory[] }> {
  return get(`/categories`, { revalidate: 600, tags: ["categories"] });
}

// ── Banners ───────────────────────────────────────────────────────────────

export async function listBanners(
  placement: BannerPlacement,
  customKey?: string
): Promise<{ items: ApiBanner[] }> {
  const qs = new URLSearchParams({ placement });
  if (customKey) qs.set("customKey", customKey);
  return get(`/banners?${qs}`, { revalidate: 30, tags: [`banners:${placement}`] });
}

// ── Store ─────────────────────────────────────────────────────────────────

export async function getStore(): Promise<ApiStore> {
  return get(`/store`, { revalidate: 300, tags: ["store"] });
}

// ── Orders ────────────────────────────────────────────────────────────────

export async function createOrder(payload: ApiCheckoutPayload): Promise<ApiCheckoutResponse> {
  return post(`/checkout`, payload);
}

export async function getOrder(orderNumber: string, email: string): Promise<ApiOrderDetail> {
  const qs = new URLSearchParams({ email });
  return get(`/orders/${encodeURIComponent(orderNumber)}?${qs}`, { revalidate: 0 });
}
