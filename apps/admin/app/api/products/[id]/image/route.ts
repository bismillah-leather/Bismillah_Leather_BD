import { getPrisma } from "@bismillah/db";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { readR2Config, putR2Object } from "@/lib/r2";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
]);

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!readR2Config()) {
    return NextResponse.json(
      { error: "Image hosting is not set up yet. Add the R2 keys in .env." },
      { status: 503 },
    );
  }

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
  const ext = ALLOWED.get(file.type);
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
    url = await putR2Object(key, bytes, file.type);
  } catch (error) {
    console.error("[admin] product image upload failed:", error);
    return NextResponse.json({ error: "Could not store the photo on R2." }, { status: 502 });
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

  return NextResponse.json({ ok: true, url });
}
