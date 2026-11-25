import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { requestStoreOrigin } from "@/lib/media-url";
import { imageExtension, storeUploadedImage } from "@/lib/store-upload";
import { forgetAdminLists } from "@/lib/ttl-cache";

export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 16;

function publicSrc(url: string, origin: string) {
  return url.startsWith("/") && origin ? `${origin}${url}` : url;
}

async function refreshOgImage(productId: string) {
  const prisma = getPrisma();
  const cover = await prisma.productMedia.findFirst({
    where: { productId, type: "image" },
    orderBy: { sortOrder: "asc" },
    select: { storageKey: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: { ogImageKey: cover?.storageKey ?? null },
  });
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await ctx.params;
  const prisma = getPrisma();
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true, slug: true, ogImageKey: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const imageCount = await prisma.productMedia.count({
    where: { productId: id, type: "image" },
  });
  if (imageCount >= MAX_IMAGES) {
    return NextResponse.json({ error: "This product already has 16 photos." }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a photo upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  }
  const ext = imageExtension(file);
  if (!ext) {
    return NextResponse.json({ error: "Use JPG, PNG, WebP, AVIF, or GIF." }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Photo must be under 8 MB." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const key = `products/${product.slug}/${Date.now().toString(36)}.${ext}`;

  let url: string;
  try {
    url = await storeUploadedImage(key, bytes, file.type || `image/${ext}`);
  } catch (error) {
    console.error("[admin] product image upload failed:", error);
    const message = error instanceof Error ? error.message : "Could not store the photo.";
    const status = message.includes("not set up") ? 503 : 502;
    return NextResponse.json(
      { error: status === 503 ? message : "Could not store the photo." },
      { status },
    );
  }

  const last = await prisma.productMedia.findFirst({
    where: { productId: id, type: "image" },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const created = await prisma.productMedia.create({
    data: {
      productId: id,
      type: "image",
      storageKey: url,
      alt: product.name,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      processingStatus: "ready",
    },
    select: { id: true, storageKey: true, sortOrder: true },
  });

  if (!product.ogImageKey) {
    await prisma.product.update({
      where: { id },
      data: { ogImageKey: url },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "product.image_add",
      entityType: "Product",
      entityId: id,
      after: { mediaId: created.id, url },
    },
  });

  forgetAdminLists();
  const origin = await requestStoreOrigin();
  return NextResponse.json({
    ok: true,
    url,
    src: publicSrc(url, origin),
    mediaId: created.id,
    sortOrder: created.sortOrder,
  });
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await ctx.params;
  const mediaId = new URL(request.url).searchParams.get("mediaId")?.trim() ?? "";
  if (!mediaId) {
    return NextResponse.json({ error: "mediaId is required." }, { status: 400 });
  }

  const prisma = getPrisma();
  const media = await prisma.productMedia.findFirst({
    where: { id: mediaId, productId: id, type: "image" },
    select: { id: true, storageKey: true },
  });
  if (!media) return NextResponse.json({ error: "Photo not found." }, { status: 404 });

  await prisma.productMedia.delete({ where: { id: media.id } });
  await refreshOgImage(id);

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "product.image_delete",
      entityType: "Product",
      entityId: id,
      before: { mediaId: media.id, url: media.storageKey },
    },
  });

  forgetAdminLists();
  return NextResponse.json({ ok: true, removed: media.id });
}
