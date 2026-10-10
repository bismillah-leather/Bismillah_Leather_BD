/** Initial catalog. The owner can rename, reparent, or archive these later. */
export const INITIAL_CATEGORIES = [
  {
    name: "Long Wallet",
    slug: "long-wallet",
    group: "Wallets",
    blurb: "Full-length bills and cards.",
    sortOrder: 10,
  },
  {
    name: "Short Wallet",
    slug: "short-wallet",
    group: "Wallets",
    blurb: "Bifold, pocket-first.",
    sortOrder: 20,
  },
  {
    name: "Formal Wallet",
    slug: "formal-wallet",
    group: "Wallets",
    blurb: "Slim profiles for dress carry.",
    sortOrder: 30,
  },
  {
    name: "Mini Wallet",
    slug: "mini-wallet",
    group: "Wallets",
    blurb: "Cards and a little cash.",
    sortOrder: 40,
  },
  {
    name: "Semi Long Wallet",
    slug: "semi-long-wallet",
    group: "Wallets",
    blurb: "Between a bifold and a long wallet.",
    sortOrder: 50,
  },
  {
    name: "Buffalo Wallet",
    slug: "buffalo-wallet",
    group: "Wallets",
    blurb: "Heavier hide, stronger edges.",
    sortOrder: 60,
  },
  {
    name: "LV Wallet",
    slug: "lv-wallet",
    group: "Wallets",
    blurb: "Patterned styles in the LV line.",
    sortOrder: 70,
  },
  {
    name: "Formal Belt",
    slug: "formal-belt",
    group: "Belts",
    blurb: "Dress belts with a clean buckle line.",
    sortOrder: 80,
  },
  {
    name: "Jeans Belt",
    slug: "jeans-belt",
    group: "Belts",
    blurb: "Everyday belts cut for denim.",
    sortOrder: 90,
  },
] as const;

export type InitialCategory = (typeof INITIAL_CATEGORIES)[number];

export const INITIAL_MATERIALS = [
  { name: "Buffalo", slug: "buffalo" },
  { name: "Genuine leather", slug: "genuine-leather" },
] as const;

export function categoryBySlug(slug: string): InitialCategory | undefined {
  return INITIAL_CATEGORIES.find((category) => category.slug === slug);
}
