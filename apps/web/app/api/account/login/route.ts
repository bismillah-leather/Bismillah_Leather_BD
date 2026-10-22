import { getPrisma } from "@bismillah/db";
import type { Prisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { loginOrRegisterCustomer } from "@/lib/customer-auth";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const limited = hitRateLimit(`customer-login:${ip}`, 20, 15 * 60 * 1000);
  if (!limited.ok) {
    try {
      const prisma = getPrisma();
      const key = "security.alerts";
      const row = await prisma.setting.findUnique({ where: { key } });
      const prev = Array.isArray(row?.value) ? (row.value as Prisma.JsonArray) : [];
      const alert: Prisma.JsonObject = {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        kind: "customer_rate_limit",
        ip,
        detail: `Customer account rate limit from ${ip}`,
      };
      const next: Prisma.JsonArray = [alert, ...prev].slice(0, 50);
      await prisma.setting.upsert({
        where: { key },
        create: { key, value: next },
        update: { value: next },
      });
    } catch {
      // non-fatal
    }
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  let body: { name?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const result = await loginOrRegisterCustomer(
    typeof body.name === "string" ? body.name : "",
    typeof body.phone === "string" ? body.phone : "",
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
