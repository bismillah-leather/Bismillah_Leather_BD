import { getPrisma } from "@bismillah/db";
import type { Prisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import {
  registerCustomer,
  signInCustomer,
  type CustomerAuthMode,
} from "@/lib/customer-auth";
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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const mode: CustomerAuthMode =
    body.mode === "signin" || body.mode === "register" ? body.mode : "register";
  const phone = typeof body.phone === "string" ? body.phone : "";
  const remember = body.remember === true;

  const result =
    mode === "signin"
      ? await signInCustomer(phone, remember)
      : await registerCustomer({
          name: typeof body.name === "string" ? body.name : "",
          phoneRaw: phone,
          email: typeof body.email === "string" ? body.email : "",
          district: typeof body.district === "string" ? body.district : "",
          addressLine: typeof body.addressLine === "string" ? body.addressLine : "",
          whatsappOk: body.whatsappOk === true,
          termsAccepted: body.termsAccepted === true,
          remember,
        });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, mode });
}
