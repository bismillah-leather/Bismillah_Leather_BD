import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { putR2Object, readR2Config } from "@/lib/r2";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
]);

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!readR2Config()) {
    return NextResponse.json(
      { error: "Image hosting is not set up yet. Paste a /catalog image path, or add the R2 keys." },
      { status: 503 },
    );
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
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return NextResponse.json({ error: "Use JPG, PNG, WebP, AVIF, or GIF." }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Photo must be under 8 MB." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const key = `content/${Date.now().toString(36)}.${ext}`;
  try {
    const url = await putR2Object(key, bytes, file.type);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[admin] content image upload failed:", error);
    return NextResponse.json({ error: "Could not store the photo on R2." }, { status: 502 });
  }
}
