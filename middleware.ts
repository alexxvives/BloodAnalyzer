import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "ba_session";

const PROTECTED_PREFIXES = ["/upload", "/report", "/history", "/app", "/preview"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!needsAuth) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) return NextResponse.next();

  const home = new URL("/", request.url);
  home.searchParams.set("auth", "login");
  home.searchParams.set("next", pathname);
  return NextResponse.redirect(home);
}

export const config = {
  matcher: [
    "/upload/:path*",
    "/report/:path*",
    "/history/:path*",
    "/app/:path*",
    "/preview/:path*",
  ],
};
