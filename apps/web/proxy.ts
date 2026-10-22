import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/account")) {
    return NextResponse.next();
  }

  if (pathname === "/account/login" || pathname.startsWith("/api/account/")) {
    if (pathname === "/account/login" && request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value) {
      return NextResponse.redirect(new URL("/account", request.url));
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) {
    const login = new URL("/account/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account", "/account/:path*"],
};
