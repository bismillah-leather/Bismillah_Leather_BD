import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { requestStoreOrigin } from "@/lib/media-url";
import { imageExtension, storeUploadedImage } from "@/lib/store-upload";

const MAX_BYTES = 8 * 1024 * 1024;

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
    select: { id: true, name: true, slug: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

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

  const existing = await prisma.productMedia.findFirst({
    where: { productId: id, type: "image" },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  if (existing) {
    await prisma.productMedia.update({
      where: { id: existing.id },
      data: { storageKey: url, alt: product.name, processingStatus: "ready" },
    });
  } else {
    await prisma.productMedia.create({
      data: {
        productId: id,
        type: "image",
        storageKey: url,
        alt: product.name,
        sortOrder: 0,
        processingStatus: "ready",
      },
    });
  }

  await prisma.product.update({
    where: { id },
    data: { ogImageKey: url },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.sub,
      action: "product.image",
      entityType: "Product",
      entityId: id,
      after: { url },
    },
  });

  const origin = await requestStoreOrigin();
  const src = url.startsWith("/") && origin ? `${origin}${url}` : url;
  return NextResponse.json({ ok: true, url, src });
}
