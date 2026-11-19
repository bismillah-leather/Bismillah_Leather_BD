import { readSeoConfig, writeSeoConfig } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { forgetAdminLists } from "@/lib/ttl-cache";

function field(body: Record<string, unknown>, key: string) {
  return typeof body[key] === "string" ? body[key] : undefined;
}

export async function GET() {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json(await readSeoConfig());
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

  const saved = await writeSeoConfig({
    gtmId: field(body, "gtmId"),
    ga4Id: field(body, "ga4Id"),
    googleAdsId: field(body, "googleAdsId"),
    googleSiteVerification: field(body, "googleSiteVerification"),
    bingSiteVerification: field(body, "bingSiteVerification"),
    facebookPixelId: field(body, "facebookPixelId"),
    tiktokPixelId: field(body, "tiktokPixelId"),
    seoTitle: field(body, "seoTitle"),
    seoDescription: field(body, "seoDescription"),
    seoKeywords: field(body, "seoKeywords"),
  });

  forgetAdminLists();
  return NextResponse.json(saved);
}
