import { readLandingPages, writeLandingPages } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { forgetAdminLists } from "@/lib/ttl-cache";

export async function GET() {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const pages = await readLandingPages();
  return NextResponse.json({ pages }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  try {
    const pages = await writeLandingPages(body);
    forgetAdminLists();
    return NextResponse.json({ pages });
  } catch (error) {
    console.error("[admin] landing pages save failed:", error);
    return NextResponse.json({ error: "Could not save the landing pages." }, { status: 500 });
  }
}
