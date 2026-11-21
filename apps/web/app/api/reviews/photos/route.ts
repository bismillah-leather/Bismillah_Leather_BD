import { NextResponse } from "next/server";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import {
  REVIEW_PHOTO_MAX_BYTES,
  reviewImageExt,
  storeReviewPhoto,
} from "@/lib/review-media";

export const maxDuration = 30;

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const limited = await hitRateLimit(`review-photo:${ip}`, 20, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Choose a photo." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a photo." }, { status: 400 });
  }
  const ext = reviewImageExt(file);
  if (!ext) return NextResponse.json({ error: "Use JPG, PNG, WebP, or GIF." }, { status: 400 });
  if (file.size <= 0 || file.size > REVIEW_PHOTO_MAX_BYTES) {
    return NextResponse.json({ error: "Each photo must be under 5 MB." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const key = `reviews/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  try {
    const url = await storeReviewPhoto(key, bytes, file.type || `image/${ext}`);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[web] review photo failed:", error);
    return NextResponse.json({ error: "Could not store the photo." }, { status: 502 });
  }
}
