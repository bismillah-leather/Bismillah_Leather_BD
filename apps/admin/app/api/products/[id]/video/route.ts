import { getPrisma } from "@bismillah/db";
import { isSupportedVideoUrl } from "@bismillah/shared";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";

async function loadProduct(id: string) {
  const prisma = getPrisma();
  return prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      media: {
        where: { type: "video" },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { id: true, storageKey: true },
      },
    },
  });
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await ctx.params;
  const product = await loadProduct(id);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const video = product.media[0] ?? null;
  return NextResponse.json({
    productId: product.id,
    slug: product.slug,
    videoUrl: video?.storageKey ?? null,
    mediaId: video?.id ?? null,
  });
}

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json({ error: "Video URL required." }, { status: 400 });
  }
  if (!isSupportedVideoUrl(url)) {
    return NextResponse.json(
      { error: "Use a YouTube or Facebook video / live / reel link." },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  const product = await loadProduct(id);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const existing = product.media[0];
  let mediaId: string;
  if (existing) {
    const updated = await prisma.productMedia.update({
      where: { id: existing.id },
      data: { storageKey: url, processingStatus: "ready", alt: `${product.name} video` },
      select: { id: true, storageKey: true },
    });
    mediaId = updated.id;
  } else {
    const created = await prisma.productMedia.create({
      data: {
        productId: product.id,
        type: "video",
        storageKey: url,
        sortOrder: 100,
        alt: `${product.name} video`,
        processingStatus: "ready",
      },
      select: { id: true, storageKey: true },
    });
    mediaId = created.id;
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: existing ? "product.video_update" : "product.video_add",
      entityType: "Product",
      entityId: product.id,
      after: { slug: product.slug, videoUrl: url },
    },
  });

  return NextResponse.json({ ok: true, mediaId, videoUrl: url });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await ctx.params;
  const prisma = getPrisma();
  const product = await loadProduct(id);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const deleted = await prisma.productMedia.deleteMany({
    where: { productId: product.id, type: "video" },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "product.video_delete",
      entityType: "Product",
      entityId: product.id,
      before: { slug: product.slug, videoUrl: product.media[0]?.storageKey ?? null },
      after: { removed: deleted.count },
    },
  });

  return NextResponse.json({ ok: true, removed: deleted.count });
}
