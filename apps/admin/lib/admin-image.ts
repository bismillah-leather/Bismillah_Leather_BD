const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;
const SKIP_UNDER_BYTES = 450_000;

function blobToFile(blob: Blob, name: string) {
  return new File([blob], name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

/** Shrink phone photos so live uploads stay under the Vercel body cap and do not freeze the tab. */
export async function prepareAdminImage(file: File): Promise<File> {
  if (file.size <= SKIP_UNDER_BYTES && (file.type === "image/jpeg" || file.type === "image/webp")) {
    return file;
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    if (file.size > 3.5 * 1024 * 1024) {
      throw new Error("That photo is too large. Use a smaller JPG or PNG.");
    }
    return file;
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), "image/jpeg", JPEG_QUALITY);
  });
  if (!blob || blob.size <= 0) return file;
  if (blob.size >= file.size && file.size <= 3.5 * 1024 * 1024) return file;
  return blobToFile(blob, file.name);
}

export async function postAdminImage(url: string, file: File) {
  const prepared = await prepareAdminImage(file);
  const body = new FormData();
  body.set("file", prepared);
  const response = await fetch(url, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(25_000),
  });
  const data = (await response.json().catch(() => ({}))) as {
    url?: string;
    src?: string;
    mediaId?: string;
    error?: string;
  };
  if (!response.ok || !data.url) {
    throw new Error(data.error || "Photo was not saved.");
  }
  return { url: data.url, src: data.src || data.url, mediaId: data.mediaId };
}
