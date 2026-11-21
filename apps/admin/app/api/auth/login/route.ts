import { NextResponse } from "next/server";
import { loginAdmin } from "@/lib/admin-auth";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { pushSecurityAlert } from "@/lib/security-alerts";

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const limited = await hitRateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.ok) {
    await pushSecurityAlert({
      kind: "admin_rate_limit",
      ip,
      detail: `Admin login rate limit hit from ${ip}`,
    });
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required." }, { status: 400 });
  }

  const result = await loginAdmin(email, password, ip);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
