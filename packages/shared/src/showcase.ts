export type LeatherTone = "black" | "brown" | "tan" | "cognac";
export type ProductKind = "wallet" | "belt";

export type ShowcaseProduct = {
  slug: string;
  image: string;
  name: string;
  sku: string;
  categorySlug: string;
  pricePaisa: bigint;
  salePaisa: bigint | null;
  colors: readonly string[];
  tone: LeatherTone;
  kind: ProductKind;
  inStock: boolean;
  /** Red NEW badge. Admin turns this on per product. */
  isNew?: boolean;
  blurb: string;
  /** Extra bullets under Description (optional). */
  highlights?: readonly string[];
  /** YouTube / Facebook watch or live URL (optional). Admin can override via store. */
  videoUrl?: string | null;
};

export const SHOWCASE_PRODUCTS: readonly ShowcaseProduct[] = [
  {
    slug: "black-long-wallet",
    image: "/catalog/wallet-black-long.jpg",
    name: "Black Long Wallet",
    sku: "BL-LW-001",
    categorySlug: "long-wallet",
    pricePaisa: 185_000n,
    salePaisa: 165_000n,
    colors: ["Black", "Brown"],
    tone: "black",
    kind: "wallet",
    inStock: true,
    blurb: "Full-length bills, eight card slots, and a zip coin pocket.",
    highlights: [
      "8 card slots · zip coin pocket · full-length cash chamber",
      "Full-grain leather feel, cut for daily carry",
      "Packed after a confirmation call · Mirpur-10 showroom",
    ],
  },
  {
    slug: "brown-long-wallet",
    image: "/catalog/wallet-brown-long.jpg",
    name: "Brown Long Wallet",
    sku: "BL-LW-002",
    categorySlug: "long-wallet",
    pricePaisa: 185_000n,
    salePaisa: null,
    colors: ["Brown", "Tan"],
    tone: "brown",
    kind: "wallet",
    inStock: true,
    blurb: "A warmer hide with the same full-length layout.",
    highlights: [
      "Same long layout in a warmer hide",
      "Full-grain leather feel, cut for daily carry",
      "Cash on delivery across Bangladesh",
    ],
  },
  {
    slug: "black-short-wallet",
    image: "/catalog/wallet-black-short.jpg",
    name: "Black Short Wallet",
    sku: "BL-SW-001",
    categorySlug: "short-wallet",
    pricePaisa: 135_000n,
    salePaisa: 119_000n,
    colors: ["Black"],
    tone: "black",
    kind: "wallet",
    inStock: true,
    blurb: "Bifold for cards and folded notes.",
    highlights: [
      "Bifold · cards and folded notes",
      "Full-grain leather feel, cut for daily carry",
      "Packed after a confirmation call · Mirpur-10 showroom",
    ],
  },
  {
    slug: "tan-formal-wallet",
    image: "/catalog/wallet-tan-formal.jpg",
    name: "Tan Formal Wallet",
    sku: "BL-FW-001",
    categorySlug: "formal-wallet",
    pricePaisa: 155_000n,
    salePaisa: null,
    colors: ["Tan", "Black"],
    tone: "tan",
    kind: "wallet",
    inStock: true,
    blurb: "Slim profile for a dress pocket.",
    highlights: [
      "Slim dress-pocket profile",
      "Full-grain leather feel, cut for daily carry",
      "Cash on delivery across Bangladesh",
    ],
  },
  {
    slug: "mini-magnetic-short-wallet",
    image: "/catalog/wallet-cognac-mini.jpg",
    name: "Mini Magnetic Short Wallet",
    sku: "BL-MW-001",
    categorySlug: "mini-wallet",
    pricePaisa: 70_000n,
    salePaisa: null,
    colors: ["Black", "Chocolate"],
    tone: "cognac",
    kind: "wallet",
    inStock: true,
    blurb: "জেনুইন লেদার মিনি ওয়ালেট। Compact size with magnetic close. Black & Chocolate.",
    highlights: [
      "Compact magnetic close · Black & Chocolate",
      "Full-grain leather feel, cut for daily carry",
      "Packed after a confirmation call · Mirpur-10 showroom",
    ],
  },
  {
    slug: "rfid-trifold-wallet",
    image: "/catalog/wallet-black-short.jpg",
    name: "RFID Trifold Wallet",
    sku: "BL-TF-001",
    categorySlug: "trifold-wallet",
    pricePaisa: 145_000n,
    salePaisa: null,
    colors: ["Black", "Chocolate"],
    tone: "black",
    kind: "wallet",
    inStock: true,
    blurb: "Genuine leather trifold with RFID blocking. Cards stay organised; scanning risk goes down.",
    highlights: [
      "RFID blocking · organised card slots",
      "Full-grain leather feel, cut for daily carry",
      "Cash on delivery across Bangladesh",
    ],
  },
  {
    slug: "magnetic-double-phone-long-wallet",
    image: "/catalog/wallet-black-long.jpg",
    name: "Magnetic Double Phone Long Wallet",
    sku: "BL-LW-PHONE",
    categorySlug: "long-wallet",
    pricePaisa: 195_000n,
    salePaisa: null,
    colors: ["Black", "Olive"],
    tone: "black",
    kind: "wallet",
    inStock: true,
    blurb: "জেনুইন লেদার লং ওয়ালেট for two phones, premium magnetic close. Black & Olive.",
    highlights: [
      "Fits two phones · premium magnetic close",
      "Full-grain leather feel, cut for daily carry",
      "Packed after a confirmation call · Mirpur-10 showroom",
    ],
  },
  {
    slug: "thara-soft-leather-wallet",
    image: "/catalog/wallet-brown-long.jpg",
    name: "Thara Soft Leather Wallet",
    sku: "BL-TH-001",
    categorySlug: "thara-wallet",
    pricePaisa: 175_000n,
    salePaisa: null,
    colors: ["Black", "Chocolate"],
    tone: "brown",
    kind: "wallet",
    inStock: true,
    blurb:
      "১০০% জেনুইন সফট লেদার। ৮ card slots, ২ document gaps, YKK zip coin pocket, large cash chamber with inner zip.",
    highlights: [
      "৮ card slots · ২ document gaps · YKK zip coin pocket",
      "Soft full-grain leather for daily carry",
      "Cash on delivery across Bangladesh",
    ],
  },
  {
    slug: "mini-full-leather-wallet",
    image: "/catalog/wallet-black-semi.jpg",
    name: "Mini Full Leather Wallet",
    sku: "BL-MW-002",
    categorySlug: "mini-wallet",
    pricePaisa: 85_000n,
    salePaisa: null,
    colors: ["Black", "Chocolate"],
    tone: "black",
    kind: "wallet",
    inStock: true,
    blurb: "৩″ × ৪″. Magnetic coin slot, ২ card slots, ২ document slots. Full leather, no fabric.",
    highlights: [
      "Magnetic coin slot · ২ card slots · ২ document slots",
      "Full leather, no fabric lining",
      "Packed after a confirmation call · Mirpur-10 showroom",
      "Cash on delivery across Bangladesh",
    ],
  },
  {
    slug: "three-quarter-multifunction-wallet",
    image: "/catalog/wallet-espresso.jpg",
    name: "Three Quarter Multifunction Wallet",
    sku: "BL-TQ-001",
    categorySlug: "semi-long-wallet",
    pricePaisa: 155_000n,
    salePaisa: null,
    colors: ["Black", "Chocolate"],
    tone: "cognac",
    kind: "wallet",
    inStock: true,
    blurb: "থ্রি কোয়ার্টার মাল্টি-ফাংশনাল ওয়ালেট। Genuine leather. Black & Chocolate.",
    highlights: [
      "Three-quarter multifunction layout",
      "Full-grain leather feel, cut for daily carry",
      "Cash on delivery across Bangladesh",
    ],
  },
  {
    slug: "buffalo-wallet",
    image: "/catalog/wallet-buffalo.jpg",
    name: "Buffalo Wallet",
    sku: "BL-BW-001",
    categorySlug: "buffalo-wallet",
    pricePaisa: 220_000n,
    salePaisa: 198_000n,
    colors: ["Brown", "Black"],
    tone: "brown",
    kind: "wallet",
    inStock: true,
    blurb: "Heavier buffalo hide with a firm edge.",
    highlights: [
      "Buffalo hide · firm edge",
      "Built for heavy daily carry",
      "Packed after a confirmation call · Mirpur-10 showroom",
    ],
  },
  {
    slug: "lv-line-wallet",
    image: "/catalog/wallet-espresso.jpg",
    name: "LV Line Wallet",
    sku: "BL-LV-001",
    categorySlug: "lv-wallet",
    pricePaisa: 245_000n,
    salePaisa: null,
    colors: ["Brown", "Black"],
    tone: "cognac",
    kind: "wallet",
    inStock: true,
    blurb: "Patterned LV line, long layout.",
    highlights: [
      "Patterned LV line · long layout",
      "Full-grain leather feel, cut for daily carry",
      "Cash on delivery across Bangladesh",
    ],
  },
  {
    slug: "black-formal-belt",
    image: "/catalog/belt-black-formal.jpg",
    name: "Black Formal Belt",
    sku: "BL-FB-001",
    categorySlug: "formal-belt",
    pricePaisa: 145_000n,
    salePaisa: 125_000n,
    colors: ["Black", "Brown"],
    tone: "black",
    kind: "belt",
    inStock: true,
    blurb: "Automatic buckle, dress width.",
    highlights: [
      "Automatic buckle · dress width",
      "Packed after a confirmation call · Mirpur-10 showroom",
      "Cash on delivery across Bangladesh",
    ],
  },
  {
    slug: "brown-formal-belt",
    image: "/catalog/belt-brown-formal.jpg",
    name: "Brown Formal Belt",
    sku: "BL-FB-002",
    categorySlug: "formal-belt",
    pricePaisa: 145_000n,
    salePaisa: null,
    colors: ["Brown"],
    tone: "brown",
    kind: "belt",
    inStock: true,
    blurb: "Smooth strap for formal trousers.",
    highlights: [
      "Smooth formal strap",
      "Packed after a confirmation call · Mirpur-10 showroom",
      "Cash on delivery across Bangladesh",
    ],
  },
  {
    slug: "black-jeans-belt",
    image: "/catalog/belt-black-jeans.jpg",
    name: "Black Jeans Belt",
    sku: "BL-JB-001",
    categorySlug: "jeans-belt",
    pricePaisa: 125_000n,
    salePaisa: null,
    colors: ["Black", "Brown"],
    tone: "black",
    kind: "belt",
    inStock: true,
    blurb: "Everyday width cut for denim.",
    highlights: [
      "Everyday denim width",
      "Packed after a confirmation call · Mirpur-10 showroom",
      "Cash on delivery across Bangladesh",
    ],
  },
  {
    slug: "tan-jeans-belt",
    image: "/catalog/belt-tan-jeans.jpg",
    name: "Tan Jeans Belt",
    sku: "BL-JB-002",
    categorySlug: "jeans-belt",
    pricePaisa: 125_000n,
    salePaisa: 109_000n,
    colors: ["Tan"],
    tone: "tan",
    kind: "belt",
    inStock: true,
    blurb: "Lighter strap for casual wear.",
    highlights: [
      "Lighter casual strap",
      "Packed after a confirmation call · Mirpur-10 showroom",
      "Cash on delivery across Bangladesh",
    ],
  },
];

export function productBySlug(slug: string): ShowcaseProduct | undefined {
  return SHOWCASE_PRODUCTS.find((product) => product.slug === slug);
}

export function productsByCategory(categorySlug: string): ShowcaseProduct[] {
  return SHOWCASE_PRODUCTS.filter((product) => product.categorySlug === categorySlug);
}

export type ProductView = {
  slug: string;
  name: string;
  sku: string;
  categorySlug: string;
  blurb: string;
  highlights: readonly string[];
  colors: readonly string[];
  tone: LeatherTone;
  kind: ProductKind;
  inStock: boolean;
  image: string;
  pricePaisa: string;
  comparePaisa: string | null;
  videoUrl: string | null;
};

const DEFAULT_HIGHLIGHTS = [
  "Full-grain leather feel, cut for daily carry",
  "Packed after a confirmation call · Mirpur-10 showroom",
  "Cash on delivery across Bangladesh",
] as const;

export function galleryFor(product: ShowcaseProduct): string[] {
  const related = SHOWCASE_PRODUCTS.filter(
    (item) => item.kind === product.kind && item.slug !== product.slug,
  )
    .slice(0, 2)
    .map((item) => item.image);
  return [product.image, ...related];
}

export function toProductView(
  product: ShowcaseProduct,
  overrides?: { videoUrl?: string | null },
): ProductView {
  const videoUrl =
    overrides && "videoUrl" in overrides
      ? (overrides.videoUrl ?? null)
      : (product.videoUrl ?? null);

  return {
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    categorySlug: product.categorySlug,
    blurb: product.blurb,
    highlights: product.highlights?.length ? product.highlights : DEFAULT_HIGHLIGHTS,
    colors: product.colors,
    tone: product.tone,
    kind: product.kind,
    inStock: product.inStock,
    image: product.image,
    pricePaisa: (product.salePaisa ?? product.pricePaisa).toString(),
    comparePaisa: product.salePaisa ? product.pricePaisa.toString() : null,
    videoUrl,
  };
}

export function searchProducts(query: string): ShowcaseProduct[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...SHOWCASE_PRODUCTS];
  return SHOWCASE_PRODUCTS.filter((product) => {
    if (product.categorySlug === needle || product.kind === needle) return true;
    const haystack =
      `${product.name} ${product.sku} ${product.blurb} ${product.categorySlug} ${product.kind}`.toLowerCase();
    return haystack.includes(needle);
  });
}
