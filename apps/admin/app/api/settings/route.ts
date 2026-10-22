import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";

const EDITABLE = new Set([
  "store.supportPhone",
  "store.supportWhatsapp",
  "store.codNote",
  "store.announcement",
  "store.shippingNote",
  "store.address",
]);

export async function PATCH(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { key?: string; value?: unknown };
  try {
    body = (await request.json()) as { key?: string; value?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const key = typeof body.key === "string" ? body.key : "";
  if (!EDITABLE.has(key)) {
    return NextResponse.json({ error: "This setting key is not editable here." }, { status: 400 });
  }

  const value =
    typeof body.value === "string" ||
    typeof body.value === "number" ||
    typeof body.value === "boolean" ||
    body.value === null
      ? body.value
      : String(body.value ?? "");

  const prisma = getPrisma();
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "setting.update",
      entityType: "Setting",
      entityId: key,
      after: { key, value },
    },
  });

  return NextResponse.json({ ok: true });
}
