import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Better Auth default session cookie (also check secure prefix variant). */
const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

const PROTECTED_PREFIXES = ["/upload", "/report", "/history", "/app"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!needsAuth) return NextResponse.next();

  const hasSession = SESSION_COOKIES.some((name) =>
    Boolean(request.cookies.get(name)?.value),
  );
  if (hasSession) return NextResponse.next();

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
  ],
};
