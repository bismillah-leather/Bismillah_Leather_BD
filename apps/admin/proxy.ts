import { originFromProxyHeaders } from "@bismillah/shared";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminToken } from "@/lib/session";

const PUBLIC = new Set(["/", "/login", "/register", "/api/auth/login", "/api/auth/register"]);

function clearSessionCookie(res: NextResponse) {
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 0,
  });
}

async function readSession(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return { token: null as string | null, session: null };
  try {
    const session = await verifyAdminToken(token);
    return { token, session };
  } catch {
    return { token, session: null };
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Do not buffer photo uploads through the proxy — large files freeze the live admin.
  if (
    request.method === "POST" &&
    (pathname === "/api/content/image" || /\/api\/products\/[^/]+\/image$/.test(pathname))
  ) {
    return NextResponse.next();
  }
  const { token, session } = await readSession(request);

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (
    PUBLIC.has(pathname) ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/register")
  ) {
    return NextResponse.next();
  }

  if (!session) {
    const home = request.nextUrl.clone();
    const origin = originFromProxyHeaders((name) => request.headers.get(name), request.nextUrl.origin);
    const pub = new URL(origin);
    home.protocol = pub.protocol;
    home.hostname = pub.hostname;
    home.port = pub.port;
    home.pathname = "/";
    home.search = "";
    if (pathname !== "/") home.searchParams.set("next", pathname);
    const res = NextResponse.redirect(home);
    if (token) clearSessionCookie(res);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
