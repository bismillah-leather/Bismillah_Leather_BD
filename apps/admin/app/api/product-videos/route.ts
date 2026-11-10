import { readStoredProductVideos, writeStoredProductVideos, type ProductVideoMap } from "@bismillah/db";
import { isSupportedVideoUrl } from "@bismillah/shared";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";

export async function GET() {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const map = (await readStoredProductVideos()) ?? {};
  return NextResponse.json(map, { headers: { "Cache-Control": "no-store" } });
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

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Expected a slug → url map" }, { status: 400 });
  }

  const next: ProductVideoMap = {};
  for (const [slug, value] of Object.entries(body as Record<string, unknown>)) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (!isSupportedVideoUrl(trimmed)) {
      return NextResponse.json(
        { error: `Unsupported video URL for ${slug}. Use YouTube or Facebook video / live / reel links.` },
        { status: 400 },
      );
    }
    next[slug] = trimmed;
  }

  try {
    await writeStoredProductVideos(next);
  } catch (error) {
    console.error("[admin] product video save failed:", error);
    return NextResponse.json({ error: "Could not save product videos." }, { status: 500 });
  }

  return NextResponse.json(next);
}
