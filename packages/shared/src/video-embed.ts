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

function withHttps(raw: string): string {
  const trimmed = raw.trim().replace(/^<|>$/g, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(www\.)?(facebook\.com|fb\.watch|m\.facebook\.com|web\.facebook\.com|youtube\.com|youtu\.be|m\.youtube\.com)/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function cleanUrl(raw: string): string | null {
  const trimmed = withHttps(raw);
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

function facebookHost(hostname: string): boolean {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  return host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.watch" || host === "fb.com";
}

function unwrapFacebook(url: URL): URL {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "l.facebook.com" || host === "lm.facebook.com") {
    const target = url.searchParams.get("u");
    if (target) {
      try {
        return new URL(target);
      } catch {
        return url;
      }
    }
  }
  if (url.pathname.includes("/plugins/video.php")) {
    const href = url.searchParams.get("href");
    if (href) {
      try {
        return new URL(href);
      } catch {
        return url;
      }
    }
  }
  return url;
}

function isFacebookVideo(url: URL): boolean {
  if (!facebookHost(url.hostname)) return false;
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "fb.watch" || host === "fb.com") return true;
  const path = url.pathname.toLowerCase();
  if (
    path.includes("/videos/") ||
    path.includes("/video.php") ||
    path.includes("/reel") ||
    path.includes("/watch") ||
    path.includes("/plugins/video") ||
    path.includes("/share/v") ||
    path.includes("/share/r") ||
    path.includes("/share/video") ||
    /^\/share\/[^/]+/.test(path)
  ) {
    return true;
  }
  return url.searchParams.has("v") || url.searchParams.has("story_fbid") || url.searchParams.has("video_id");
}

function facebookPermalink(url: URL): string {
  const canonical = new URL(url.toString());
  const host = canonical.hostname.replace(/^www\./, "").toLowerCase();
  if (host !== "fb.watch" && host !== "fb.com") {
    canonical.hostname = "www.facebook.com";
  }
  canonical.hash = "";
  return canonical.toString();
}

/** Turn a YouTube or Facebook video / live / reel / share URL into an embeddable player. */
export function parseVideoEmbed(raw: string): VideoEmbed | null {
  const watchUrl = cleanUrl(raw);
  if (!watchUrl) return null;
  const url = unwrapFacebook(new URL(watchUrl));

  const yt = youtubeId(url);
  if (yt) {
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1`,
      watchUrl: url.toString(),
      label: "YouTube video",
    };
  }

  if (isFacebookVideo(url)) {
    const permalink = facebookPermalink(url);
    const href = encodeURIComponent(permalink);
    return {
      provider: "facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false&width=1280&height=720`,
      watchUrl: permalink,
      label: "Facebook video",
    };
  }

  return null;
}

export function isSupportedVideoUrl(raw: string): boolean {
  return parseVideoEmbed(raw) !== null;
}
