"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postAdminImage } from "@/lib/admin-image";

type GalleryImage = { id: string; src: string };

export function ProductGalleryEditor({
  productId,
  productName,
  initial,
}: {
  productId: string;
  productName: string;
  initial: GalleryImage[];
}) {
  const router = useRouter();
  const [images, setImages] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onAdd(file: File | undefined) {
    if (!file) return;
    setPending(true);
    setError(null);
    setOk(null);
    try {
      const data = await postAdminImage(`/admin/api/products/${productId}/image`, file);
      setImages((current) => [
        ...current,
        { id: data.mediaId || data.url, src: data.src },
      ]);
      setOk("Photo added. Other photos are unchanged.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed.");
    } finally {
      setPending(false);
    }
  }

  async function onRemove(mediaId: string) {
    if (!window.confirm(`Remove this photo from “${productName}”? Others stay.`)) return;
    setPending(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch(
        `/admin/api/products/${productId}/image?mediaId=${encodeURIComponent(mediaId)}`,
        { method: "DELETE" },
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not delete photo.");
        return;
      }
      setImages((current) => current.filter((item) => item.id !== mediaId));
      setOk("Photo removed. The rest of the gallery is unchanged.");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="admin-panel mt-8 p-5 sm:p-6">
      <div className="border-b border-border pb-4">
        <p className="text-[11px] tracking-[0.2em] text-primary uppercase">Gallery</p>
        <h2 className="font-display mt-1 text-2xl tracking-tight">Photos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a photo to the gallery. Existing shots stay. Delete only removes that one file.
        </p>
      </div>

      {images.length ? (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id} className="grid gap-2">
              <div className="aspect-[4/5] overflow-hidden rounded-md bg-[#1c1814]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.src} alt="" className="size-full object-cover" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
                  {index === 0 ? "Cover" : `Photo ${index + 1}`}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void onRemove(image.id)}
                  className="text-[11px] tracking-wide text-destructive uppercase hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">No photos yet.</p>
      )}

      <label className="mt-5 grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Add photo
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          disabled={pending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void onAdd(file);
          }}
          className="admin-field h-auto py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:text-primary-foreground"
        />
      </label>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {ok ? <p className="mt-3 text-sm text-muted-foreground">{ok}</p> : null}
    </section>
  );
}
