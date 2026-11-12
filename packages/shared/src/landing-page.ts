export type LandingStat = { value: string; label: string };
export type LandingBenefit = { title: string; text: string; image: string };
export type LandingQuote = { quote: string; name: string; detail: string; image: string };
export type LandingFaq = { question: string; answer: string };

export type LandingPage = {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  facebookPixelId: string;
  tiktokPixelId: string;
  eyebrow: string;
  headline: string;
  subhead: string;
  heroImage: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  offer: string;
  stats: LandingStat[];
  benefitsTitle: string;
  benefits: LandingBenefit[];
  storyEyebrow: string;
  storyTitle: string;
  storyBody: string;
  storyImage: string;
  quotesTitle: string;
  quotes: LandingQuote[];
  faqTitle: string;
  faqs: LandingFaq[];
  closingTitle: string;
  closingBody: string;
  closingLabel: string;
  closingHref: string;
  orderTitle: string;
  orderNote: string;
  orderButton: string;
  productSlugs: string[];
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function text(value: unknown, max: number, fallback = "") {
  const raw = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  return (raw || fallback).slice(0, max);
}

function block(value: unknown, max: number, fallback = "") {
  const raw = typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
  return (raw || fallback).slice(0, max);
}

export function cleanLandingHref(value: unknown, fallback: string) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return fallback;
  if (raw.startsWith("#") && /^#[a-z0-9-]+$/.test(raw)) return raw;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw.slice(0, 240);
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString().slice(0, 300);
  } catch {
    return fallback;
  }
  return fallback;
}

export function cleanLandingImage(value: unknown, fallback: string) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return fallback;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw.slice(0, 240);
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString().slice(0, 400);
  } catch {
    return fallback;
  }
  return fallback;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function blankLanding(id: string, name = "New landing"): LandingPage {
  const slug = slugify(name) || "landing";
  return {
    id,
    slug,
    name,
    published: false,
    seoTitle: "Genuine leather, packed in Mirpur-10",
    seoDescription: "A Bismillah Leather campaign page. Cash on delivery across Bangladesh.",
    facebookPixelId: "",
    tiktokPixelId: "",
    eyebrow: "Mirpur-10 · Cash on delivery",
    headline: "Leather that still looks new after the Eid rush",
    subhead:
      "Full-grain wallets and belts, the same pieces from our Reels. We call before we dispatch.",
    heroImage: "/catalog/wallet-black-long.jpg",
    primaryLabel: "Order now",
    primaryHref: "#order",
    secondaryLabel: "WhatsApp the shop",
    secondaryHref: "/",
    offer: "Inside Dhaka delivery ৳80 · Outside ৳130 · Confirm by phone",
    stats: [
      { value: "10+", label: "Years in Mirpur-10" },
      { value: "COD", label: "Pay when it arrives" },
      { value: "7 days", label: "Easy returns" },
    ],
    benefitsTitle: "Why this piece",
    benefits: [
      { title: "Real leather", text: "Not coated board. The grain, the smell, the edge paint.", image: "" },
      { title: "Packed to order", text: "Shah Ali Plaza, shop 12. We check the piece before it leaves.", image: "" },
      { title: "Fits the ad", text: "The photo on this page is the product we send.", image: "" },
    ],
    storyEyebrow: "The shop",
    storyTitle: "Same leather you saw on the video",
    storyBody:
      "People land here from Facebook and TikTok, then call to ask if it is the real one. It is. Tell us the colour, we confirm stock, then the rider goes out.",
    storyImage: "/catalog/wallet-brown-long.jpg",
    quotesTitle: "From the counter",
    quotes: [
      {
        quote: "Ordered at night, they called in the morning, wallet matched the photo.",
        name: "Rahim",
        detail: "Dhaka",
        image: "",
      },
      {
        quote: "The belt leather is thick. Not the thin one you get from a random page.",
        name: "Nabil",
        detail: "Chattogram",
        image: "",
      },
    ],
    faqTitle: "Before you order",
    faqs: [
      {
        question: "Do I pay online?",
        answer: "No. Cash on delivery. We call to confirm the address first.",
      },
      {
        question: "How fast does it ship?",
        answer: "Inside Dhaka usually the next day after the confirmation call. Outside Dhaka follows the courier.",
      },
      {
        question: "Can I return it?",
        answer: "Yes, within 7 days if the piece is unused and still in the condition we sent.",
      },
    ],
    closingTitle: "Tell us the colour. We will hold it.",
    closingBody: "Message the shop or go straight to the piece.",
    closingLabel: "Order now",
    closingHref: "#order",
    orderTitle: "Order now",
    orderNote: "Cash on delivery. We call to confirm, then the rider goes out. Pay when it arrives.",
    orderButton: "Place order",
    productSlugs: [],
  };
}

function asList<T>(value: unknown, map: (item: unknown) => T | null, max: number): T[] {
  if (!Array.isArray(value)) return [];
  const next: T[] = [];
  for (const item of value) {
    const row = map(item);
    if (row) next.push(row);
    if (next.length >= max) break;
  }
  return next;
}

export function normalizeLanding(value: unknown, fallbackId: string): LandingPage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const base = blankLanding(fallbackId);
  const name = text(row.name, 80, base.name);
  const requested = text(row.slug, 60);
  const slug = SLUG.test(requested) ? requested : slugify(name) || base.slug;
  const id = text(row.id, 80, fallbackId).replace(/[^a-zA-Z0-9-]/g, "") || fallbackId;
  const facebook = text(row.facebookPixelId, 20).replace(/\D/g, "");
  const tiktok = text(row.tiktokPixelId, 32).replace(/[^A-Za-z0-9]/g, "");

  return {
    ...base,
    id,
    slug,
    name,
    published: row.published === true,
    seoTitle: text(row.seoTitle, 70, base.seoTitle),
    seoDescription: text(row.seoDescription, 180, base.seoDescription),
    facebookPixelId: facebook.length >= 5 ? facebook : "",
    tiktokPixelId: tiktok.length >= 8 ? tiktok : "",
    eyebrow: text(row.eyebrow, 60, base.eyebrow),
    headline: text(row.headline, 90, base.headline),
    subhead: text(row.subhead, 280, base.subhead),
    heroImage: cleanLandingImage(row.heroImage, base.heroImage),
    primaryLabel: text(row.primaryLabel, 32, base.primaryLabel),
    primaryHref: cleanLandingHref(row.primaryHref, base.primaryHref),
    secondaryLabel: text(row.secondaryLabel, 32, base.secondaryLabel),
    secondaryHref: cleanLandingHref(row.secondaryHref, base.secondaryHref),
    offer: text(row.offer, 140, base.offer),
    stats: asList(
      row.stats,
      (item) => {
        if (!item || typeof item !== "object") return null;
        const stat = item as Record<string, unknown>;
        const label = text(stat.label, 40);
        const valueText = text(stat.value, 16);
        if (!label || !valueText) return null;
        return { value: valueText, label };
      },
      6,
    ),
    benefitsTitle: text(row.benefitsTitle, 60, base.benefitsTitle),
    benefits: asList(
      row.benefits,
      (item) => {
        if (!item || typeof item !== "object") return null;
        const benefit = item as Record<string, unknown>;
        const title = text(benefit.title, 40);
        const body = text(benefit.text, 180);
        if (!title || !body) return null;
        return { title, text: body, image: optionalImage(benefit.image) };
      },
      8,
    ),
    storyEyebrow: text(row.storyEyebrow, 40, base.storyEyebrow),
    storyTitle: text(row.storyTitle, 80, base.storyTitle),
    storyBody: block(row.storyBody, 800, base.storyBody),
    storyImage: cleanLandingImage(row.storyImage, base.storyImage),
    quotesTitle: text(row.quotesTitle, 60, base.quotesTitle),
    quotes: asList(
      row.quotes,
      (item) => {
        if (!item || typeof item !== "object") return null;
        const quote = item as Record<string, unknown>;
        const words = text(quote.quote, 220);
        const person = text(quote.name, 40);
        if (!words || !person) return null;
        return { quote: words, name: person, detail: text(quote.detail, 40), image: optionalImage(quote.image) };
      },
      6,
    ),
    faqTitle: text(row.faqTitle, 60, base.faqTitle),
    faqs: asList(
      row.faqs,
      (item) => {
        if (!item || typeof item !== "object") return null;
        const faq = item as Record<string, unknown>;
        const question = text(faq.question, 120);
        const answer = text(faq.answer, 320);
        if (!question || !answer) return null;
        return { question, answer };
      },
      8,
    ),
    closingTitle: text(row.closingTitle, 80, base.closingTitle),
    closingBody: text(row.closingBody, 180, base.closingBody),
    closingLabel: text(row.closingLabel, 32, base.closingLabel),
    closingHref: row.closingHref === "#order" ? "#order" : cleanLandingHref(row.closingHref, base.closingHref),
    orderTitle: text(row.orderTitle, 60, base.orderTitle),
    orderNote: text(row.orderNote, 220, base.orderNote),
    orderButton: text(row.orderButton, 32, base.orderButton),
    productSlugs: slugList(row.productSlugs),
  };
}

function optionalImage(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  return cleanLandingImage(raw, "");
}

function slugList(value: unknown) {
  const raw = Array.isArray(value)
    ? value.map((item) => (typeof item === "string" ? item : "")).join(",")
    : typeof value === "string"
      ? value
      : "";
  const slugs: string[] = [];
  for (const part of raw.split(/[\s,]+/)) {
    const slug = part.trim().toLowerCase();
    if (!SLUG.test(slug) || slugs.includes(slug)) continue;
    slugs.push(slug);
    if (slugs.length >= 8) break;
  }
  return slugs;
}

export function normalizeLandingList(value: unknown): LandingPage[] {
  const raw = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { pages?: unknown }).pages)
      ? (value as { pages: unknown[] }).pages
      : [];
  const pages: LandingPage[] = [];
  const slugs = new Set<string>();
  const ids = new Set<string>();
  raw.forEach((item, index) => {
    const page = normalizeLanding(item, `landing-${index + 1}`);
    if (!page) return;
    let slug = page.slug;
    let n = 2;
    while (slugs.has(slug)) {
      slug = `${page.slug}-${n}`.slice(0, 60);
      n += 1;
    }
    let id = page.id;
    n = 2;
    while (ids.has(id)) {
      id = `${page.id}-${n}`.slice(0, 80);
      n += 1;
    }
    slugs.add(slug);
    ids.add(id);
    pages.push({ ...page, slug, id });
  });
  return pages.slice(0, 24);
}
