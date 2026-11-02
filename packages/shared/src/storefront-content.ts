export type HeroSlide = {
  src: string;
  alt: string;
  focus?: string;
};

export type AboutContent = {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
};

export type TrustItem = {
  title: string;
  text: string;
};

export type FeaturedCard = {
  slug: string;
  name: string;
  image: string;
};

export type PolicySlug = "shipping" | "returns" | "privacy";

export type PolicyDraft = {
  title: string;
  body: string;
};

export type StorefrontDraft = {
  hero: HeroSlide[];
  about: AboutContent;
  trust: TrustItem[];
  featured: FeaturedCard[];
  policies: Record<PolicySlug, PolicyDraft>;
};

export const POLICY_SLUGS = ["shipping", "returns", "privacy"] as const;

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  { src: "/catalog/hero-leather.jpg", alt: "Bismillah leather", focus: "object-[center_38%]" },
  { src: "/catalog/wallet-black-long.jpg", alt: "Long wallet", focus: "object-center" },
  { src: "/catalog/wallet-buffalo.jpg", alt: "Buffalo wallet", focus: "object-[center_35%]" },
  { src: "/catalog/belt-black-formal.jpg", alt: "Formal belt", focus: "object-center" },
];

export const DEFAULT_ABOUT: AboutContent = {
  eyebrow: "The house",
  title: "Leather, cut in Mirpur-10.",
  body: "Bismillah Leather makes wallets and belts for everyday carry. The same pieces you see on Facebook Reels are on the shelf at Shah Ali Plaza — RFID trifold, magnetic long wallet, thara soft leather, mini magnetic, and belts.\n\nOrders go out cash on delivery across Bangladesh. If something arrives wrong, message us with the order number and we sort it.",
  image: "/catalog/hero-leather.jpg",
};

export const DEFAULT_TRUST: TrustItem[] = [
  { title: "Cash on delivery", text: "Pay when the parcel arrives" },
  { title: "Dhaka ৳80", text: "Outside Dhaka ৳130" },
  { title: "Easy returns", text: "Call us if something is wrong" },
  { title: "Secure checkout", text: "We confirm before dispatch" },
];

export const DEFAULT_FEATURED: FeaturedCard[] = [
  { slug: "long-wallet", name: "Long Wallet", image: "/catalog/wallet-black-long.jpg" },
  { slug: "short-wallet", name: "Short Wallet", image: "/catalog/wallet-black-short.jpg" },
  { slug: "formal-wallet", name: "Formal Wallet", image: "/catalog/wallet-tan-formal.jpg" },
  { slug: "mini-wallet", name: "Mini Wallet", image: "/catalog/wallet-cognac-mini.jpg" },
  { slug: "trifold-wallet", name: "Trifold", image: "/catalog/wallet-black-short.jpg" },
  { slug: "semi-long-wallet", name: "Three Quarter", image: "/catalog/wallet-espresso.jpg" },
  { slug: "buffalo-wallet", name: "Buffalo", image: "/catalog/wallet-buffalo.jpg" },
  { slug: "thara-wallet", name: "Thara", image: "/catalog/wallet-brown-long.jpg" },
  { slug: "formal-belt", name: "Formal Belt", image: "/catalog/belt-black-formal.jpg" },
  { slug: "jeans-belt", name: "Jeans Belt", image: "/catalog/belt-tan-jeans.jpg" },
  { slug: "lv-wallet", name: "LV Wallet", image: "/catalog/wallet-espresso.jpg" },
];

export const DEFAULT_POLICIES: Record<PolicySlug, PolicyDraft> = {
  shipping: {
    title: "Shipping",
    body: "Cash on delivery is available inside and outside Dhaka. The delivery charge is calculated on our server from the district you enter at checkout.\n\nA courier booking is created after the order is confirmed. You receive a tracking update when the parcel is handed over.",
  },
  returns: {
    title: "Returns",
    body: "If a piece arrives damaged or is not the item you ordered, message us with your order number and we will arrange the return.\n\nReturned stock is put back through the inventory ledger, so the count you see on the site stays accurate.",
  },
  privacy: {
    title: "Privacy",
    body: "We store the name, phone number, and address needed to deliver an order. Phone numbers are saved in a single format so we do not keep duplicates.\n\nPayment details stay with the payment provider. We keep the transaction reference, not your wallet PIN or card number.",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStorefrontImageSrc(value: string) {
  if (value.startsWith("/") && !value.includes("..") && !value.includes("\\")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function cleanText(value: unknown, max: number, fallback: string) {
  if (typeof value !== "string") return fallback;
  const next = value.trim();
  if (!next) return fallback;
  return next.slice(0, max);
}

function cleanSrc(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const next = value.trim();
  return isStorefrontImageSrc(next) ? next : fallback;
}

export function readStorefrontDraft(input: {
  sections?: { key: string; payload: unknown }[];
  pages?: { slug: string; title: string; body: string }[];
}): StorefrontDraft {
  const sections = new Map((input.sections ?? []).map((section) => [section.key, section.payload]));
  const pages = new Map((input.pages ?? []).map((page) => [page.slug, page]));

  return {
    hero: readHero(sections.get("hero")),
    about: readAbout(sections.get("about")),
    trust: readTrust(sections.get("trust")),
    featured: readFeatured(sections.get("featured")),
    policies: {
      shipping: readPolicy("shipping", pages.get("shipping")),
      returns: readPolicy("returns", pages.get("returns")),
      privacy: readPolicy("privacy", pages.get("privacy")),
    },
  };
}

function readHero(payload: unknown): HeroSlide[] {
  const slides = isRecord(payload) && Array.isArray(payload.slides) ? payload.slides : [];
  const next = slides
    .map((slide, index) => {
      if (!isRecord(slide)) return null;
      const fallback = DEFAULT_HERO_SLIDES[index] ?? DEFAULT_HERO_SLIDES[0]!;
      const src = cleanSrc(slide.src, "");
      if (!src) return null;
      const focus = typeof slide.focus === "string" && slide.focus.trim() ? slide.focus.trim() : undefined;
      return {
        src,
        alt: cleanText(slide.alt, 140, fallback.alt),
        ...(focus ? { focus } : {}),
      };
    })
    .filter((slide): slide is HeroSlide => Boolean(slide))
    .slice(0, 8);
  return next.length > 0 ? next : DEFAULT_HERO_SLIDES.map((slide) => ({ ...slide }));
}

function readAbout(payload: unknown): AboutContent {
  if (!isRecord(payload)) return { ...DEFAULT_ABOUT };
  return {
    eyebrow: cleanText(payload.eyebrow, 80, DEFAULT_ABOUT.eyebrow),
    title: cleanText(payload.title, 160, DEFAULT_ABOUT.title),
    body: cleanText(payload.body, 8000, DEFAULT_ABOUT.body),
    image: cleanSrc(payload.image, DEFAULT_ABOUT.image),
  };
}

function readTrust(payload: unknown): TrustItem[] {
  const items = isRecord(payload) && Array.isArray(payload.items) ? payload.items : [];
  return DEFAULT_TRUST.map((fallback, index) => {
    const item = items[index];
    if (!isRecord(item)) return { ...fallback };
    return {
      title: cleanText(item.title, 80, fallback.title),
      text: cleanText(item.text, 180, fallback.text),
    };
  });
}

function readFeatured(payload: unknown): FeaturedCard[] {
  const items = isRecord(payload) && Array.isArray(payload.items) ? payload.items : [];
  const next = items
    .map((item) => {
      if (!isRecord(item)) return null;
      const slug = typeof item.slug === "string" ? item.slug.trim().toLowerCase() : "";
      const name = typeof item.name === "string" ? item.name.trim() : "";
      const image = typeof item.image === "string" ? item.image.trim() : "";
      if (!/^[a-z0-9-]{2,80}$/.test(slug) || !name || !isStorefrontImageSrc(image)) return null;
      return { slug, name: name.slice(0, 80), image };
    })
    .filter((item): item is FeaturedCard => Boolean(item))
    .slice(0, 12);
  return next.length > 0 ? next : DEFAULT_FEATURED.map((item) => ({ ...item }));
}

function readPolicy(slug: PolicySlug, page: { title: string; body: string } | undefined): PolicyDraft {
  const fallback = DEFAULT_POLICIES[slug];
  if (!page) return { ...fallback };
  return {
    title: cleanText(page.title, 120, fallback.title),
    body: cleanText(page.body, 8000, fallback.body),
  };
}
