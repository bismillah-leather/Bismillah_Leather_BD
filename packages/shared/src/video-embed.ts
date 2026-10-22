export type VideoProvider = "youtube" | "facebook";

export type VideoEmbed = {
  provider: VideoProvider;
  /** iframe src */
  embedUrl: string;
  /** Original watch / share URL */
  watchUrl: string;
  /** Optional title for accessibility */
  label: string;
};

function cleanUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    const v = url.searchParams.get("v");
    if (v && /^[\w-]{6,}$/.test(v)) return v;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
      const id = parts[1];
      return id && /^[\w-]{6,}$/.test(id) ? id : null;
    }
  }
  return null;
}

function isFacebookVideo(url: URL): boolean {
  const host = url.hostname.replace(/^www\./, "");
  if (!host.endsWith("facebook.com") && host !== "fb.watch") return false;
  if (host === "fb.watch") return true;
  const path = url.pathname;
  return (
    path.includes("/videos/") ||
    path.includes("/reel/") ||
    path.includes("/watch") ||
    url.searchParams.has("v")
  );
}

/** Turn a YouTube or Facebook video / live / reel URL into an embeddable player. */
export function parseVideoEmbed(raw: string): VideoEmbed | null {
  const watchUrl = cleanUrl(raw);
  if (!watchUrl) return null;
  const url = new URL(watchUrl);

  const yt = youtubeId(url);
  if (yt) {
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1`,
      watchUrl,
      label: "YouTube video",
    };
  }

  if (isFacebookVideo(url)) {
    const href = encodeURIComponent(watchUrl);
    return {
      provider: "facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false&width=1280`,
      watchUrl,
      label: "Facebook video",
    };
  }

  return null;
}

export function isSupportedVideoUrl(raw: string): boolean {
  return parseVideoEmbed(raw) !== null;
}
