import { getActiveAdmin } from "@/lib/admin-auth";
import { requestStoreOrigin } from "@/lib/media-url";
import { noStoreJson } from "@/lib/no-store";
import { imageExtension, storeUploadedImage } from "@/lib/store-upload";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return noStoreJson({ error: "Unauthorized." }, 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return noStoreJson({ error: "Expected a photo upload." }, 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return noStoreJson({ error: "Choose an image file." }, 400);
  }
  const ext = imageExtension(file);
  if (!ext) {
    return noStoreJson({ error: "Use JPG, PNG, WebP, AVIF, or GIF." }, 400);
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return noStoreJson({ error: "Photo must be under 8 MB." }, 400);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const key = `content/${Date.now().toString(36)}.${ext}`;
  try {
    const url = await storeUploadedImage(key, bytes, file.type || `image/${ext}`);
    const origin = await requestStoreOrigin();
    const src = url.startsWith("/") && origin ? `${origin}${url}` : url;
    return noStoreJson({ url, src });
  } catch (error) {
    console.error("[admin] content image upload failed:", error);
    const message = error instanceof Error ? error.message : "Could not store the photo.";
    const status = message.includes("not set up") ? 503 : 502;
    return noStoreJson(
      { error: status === 503 ? message : "Could not store the photo." },
      status,
    );
  }
}
