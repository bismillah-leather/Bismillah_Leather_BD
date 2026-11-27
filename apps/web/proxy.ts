import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CANONICAL_HOST = "bismillahleatherbd.com";
const ALIAS_HOSTS = new Set([
  "www.bismillahleatherbd.com",
  "bismillahletherbd.com",
  "www.bismillahletherbd.com",
]);

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0]?.toLowerCase() ?? "";
  if (!ALIAS_HOSTS.has(host)) return NextResponse.next();

  const dest = request.nextUrl.clone();
  dest.protocol = "https:";
  dest.hostname = CANONICAL_HOST;
  dest.port = "";
  return NextResponse.redirect(dest, 301);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|catalog/).*)"],
};
