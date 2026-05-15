import { NextResponse } from "next/server";
import { auth } from "@/server/auth";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
const API_AUTH_PREFIX = "/api/auth";
const PUBLIC_API_PREFIX = "/api/public";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Allow auth + public APIs
  if (pathname.startsWith(API_AUTH_PREFIX)) return NextResponse.next();
  if (pathname.startsWith(PUBLIC_API_PREFIX)) return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return NextResponse.next();

  const isPublic = PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!isLoggedIn && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)"],
};
