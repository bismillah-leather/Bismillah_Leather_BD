import { parseVideoEmbed } from "@bismillah/shared";
import { NextResponse } from "next/server";
import { readProductVideos, writeProductVideos, type ProductVideoMap } from "@/lib/product-videos-store";

export async function GET() {
  const map = await readProductVideos();
  return NextResponse.json(map, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Expected a slug → url map" }, { status: 400 });
  }

  const next: ProductVideoMap = {};
  for (const [slug, value] of Object.entries(body as Record<string, unknown>)) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const embed = parseVideoEmbed(trimmed);
    if (!embed) {
      return NextResponse.json(
        {
          error: `Unsupported video URL for ${slug}. Use a Facebook video / reel / share link, or YouTube.`,
        },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } },
      );
    }
    next[slug] = embed.watchUrl;
  }

  try {
    await writeProductVideos(next);
  } catch {
    return NextResponse.json(
      { error: "Could not save product videos on this host" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }

  return NextResponse.json(next, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
