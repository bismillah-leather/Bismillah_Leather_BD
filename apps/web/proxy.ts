import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerToken } from "@/lib/customer-session";

function clearSessionCookie(res: NextResponse) {
  res.cookies.set(CUSTOMER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  const session = token ? await verifyCustomerToken(token) : null;

  if (!pathname.startsWith("/account")) {
    return NextResponse.next();
  }

  if (pathname === "/account/login" || pathname.startsWith("/api/account/")) {
    if (pathname === "/account/login" && session) {
      return NextResponse.redirect(new URL("/account", request.url));
    }
    const res = NextResponse.next();
    if (pathname === "/account/login" && token && !session) clearSessionCookie(res);
    return res;
  }

  if (!session) {
    const login = new URL("/account/login", request.url);
    login.searchParams.set("next", pathname);
    const res = NextResponse.redirect(login);
    if (token) clearSessionCookie(res);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account", "/account/:path*"],
};
