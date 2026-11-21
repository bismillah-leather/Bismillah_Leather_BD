import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { registerAdmin } from "@/lib/admin-auth";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { pushSecurityAlert } from "@/lib/security-alerts";

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const limited = await hitRateLimit(`admin-register:${ip}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    await pushSecurityAlert({
      kind: "admin_rate_limit",
      ip,
      detail: `Admin register rate limit from ${ip}`,
    });
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const session = await getAdminSession();
  const result = await registerAdmin({
    name: typeof body.name === "string" ? body.name : "",
    email: typeof body.email === "string" ? body.email : "",
    password: typeof body.password === "string" ? body.password : "",
    role: typeof body.role === "string" ? body.role : "staff",
    masterKey: typeof body.masterKey === "string" ? body.masterKey : undefined,
    ip,
    actorId: session?.sub ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, id: result.id, email: result.email });
}
