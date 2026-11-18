import { publicEpsConfig, readEpsConfig, writeEpsConfig, type EpsMode } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { forgetAdminLists } from "@/lib/ttl-cache";

export async function GET() {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json(publicEpsConfig(await readEpsConfig()));
}

export async function PUT(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const mode: EpsMode = body.mode === "sandbox" ? "sandbox" : "live";
  const saved = await writeEpsConfig({
    enabled: body.enabled !== false,
    mode,
    username: typeof body.username === "string" ? body.username : undefined,
    password: typeof body.password === "string" ? body.password : undefined,
    hashKey: typeof body.hashKey === "string" ? body.hashKey : undefined,
    merchantId: typeof body.merchantId === "string" ? body.merchantId : undefined,
    storeId: typeof body.storeId === "string" ? body.storeId : undefined,
  });

  forgetAdminLists();
  return NextResponse.json(publicEpsConfig(saved));
}
