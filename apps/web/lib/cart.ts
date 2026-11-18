import { productBySlug } from "@bismillah/shared";

export type CartLine = {
  slug: string;
  color: string;
  qty: number;
  name?: string;
  image?: string;
  sku?: string;
  unitPaisa?: string;
  comparePaisa?: string | null;
};

export type CartItemView = CartLine & {
  name: string;
  image: string;
  sku: string;
  unitPaisa: string;
  comparePaisa: string | null;
  linePaisa: string;
};

export type CartSnapshot = {
  name: string;
  image: string;
  sku: string;
  unitPaisa: string;
  comparePaisa: string | null;
};

export type CartOffer = {
  slug: string;
  name: string;
  image: string;
  sku: string;
  pricePaisa: bigint | string;
  salePaisa?: bigint | string | null;
  comparePaisa?: string | null;
  inStock?: boolean;
};

export type AddToCartOpts = {
  openDrawer?: boolean;
  inStock?: boolean;
  snapshot?: CartSnapshot;
  offer?: CartOffer;
};

const STORAGE_KEY = "bl-cart-v1";
const EMPTY_LINES: CartLine[] = [];
let cached: CartLine[] = EMPTY_LINES;
let cacheReady = false;

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function snapshotFromOffer(offer: CartOffer): CartSnapshot {
  const price = String(offer.pricePaisa);
  const sale =
    offer.salePaisa != null && String(offer.salePaisa) !== "" ? String(offer.salePaisa) : "";
  const unit = sale || price;
  const compare = offer.comparePaisa != null ? offer.comparePaisa : sale && sale !== price ? price : null;
  return {
    name: offer.name,
    image: offer.image,
    sku: offer.sku,
    unitPaisa: unit,
    comparePaisa: compare,
  };
}

function snapshotFromShowcase(slug: string): CartSnapshot | undefined {
  const product = productBySlug(slug);
  if (!product) return undefined;
  return snapshotFromOffer({
    slug: product.slug,
    name: String(product.name),
    image: product.image,
    sku: product.sku,
    pricePaisa: product.pricePaisa,
    salePaisa: product.salePaisa,
    inStock: product.inStock,
  });
}

function resolveSnapshot(slug: string, opts?: AddToCartOpts): CartSnapshot | undefined {
  if (opts?.snapshot?.name && opts.snapshot.unitPaisa) return opts.snapshot;
  if (opts?.offer) return snapshotFromOffer(opts.offer);
  return snapshotFromShowcase(slug);
}

function mergeSnapshot(line: CartLine, snapshot?: CartSnapshot): CartLine {
  if (!snapshot) return line;
  return {
    ...line,
    name: snapshot.name,
    image: snapshot.image,
    sku: snapshot.sku,
    unitPaisa: snapshot.unitPaisa,
    comparePaisa: snapshot.comparePaisa,
  };
}

function readRaw(): CartLine[] {
  if (typeof window === "undefined") return EMPTY_LINES;
  if (cacheReady) return cached;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as CartLine[];
    cached = Array.isArray(parsed)
      ? parsed.filter(
          (line) =>
            line &&
            typeof line.slug === "string" &&
            typeof line.color === "string" &&
            typeof line.qty === "number" &&
            line.qty > 0,
        )
      : [];
  } catch {
    cached = [];
  }
  cacheReady = true;
  return cached;
}

function writeRaw(lines: CartLine[]) {
  cached = lines;
  cacheReady = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event("bl-cart"));
}

export function getCartLines(): CartLine[] {
  return readRaw();
}

export function cartCount(lines = readRaw()): number {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}

export function addToCart(slug: string, color: string, qty = 1, opts?: AddToCartOpts) {
  const catalog = productBySlug(slug);
  const inStock = opts?.inStock ?? opts?.offer?.inStock ?? catalog?.inStock ?? true;
  if (!inStock) return false;
  const snapshot = resolveSnapshot(slug, opts);
  if (!snapshot && !catalog) return false;

  const safeQty = Math.max(1, Math.min(5, Math.floor(qty)));
  const lines = [...readRaw()];
  const index = lines.findIndex((line) => line.slug === slug && line.color === color);
  if (index >= 0) {
    const current = lines[index]!;
    lines[index] = mergeSnapshot(
      { ...current, qty: Math.min(5, current.qty + safeQty) },
      snapshot,
    );
  } else {
    lines.push(
      mergeSnapshot(
        { slug, color, qty: safeQty },
        snapshot,
      ),
    );
  }
  writeRaw(lines);
  if (opts?.openDrawer !== false && typeof window !== "undefined") {
    window.dispatchEvent(new Event("bl-cart-open"));
  }
  return true;
}

/** Add item then go to checkout (Buy now). */
export function buyNow(slug: string, color: string, qty = 1, opts?: AddToCartOpts) {
  const ok = addToCart(slug, color, qty, { ...opts, openDrawer: false });
  if (!ok || typeof window === "undefined") return false;
  window.location.href = "/checkout";
  return true;
}

export function setCartQty(slug: string, color: string, qty: number) {
  const next = readRaw()
    .map((line) =>
      line.slug === slug && line.color === color
        ? { ...line, qty: Math.max(0, Math.min(5, Math.floor(qty))) }
        : line,
    )
    .filter((line) => line.qty > 0);
  writeRaw(next);
}

export function removeFromCart(slug: string, color: string) {
  writeRaw(readRaw().filter((line) => !(line.slug === slug && line.color === color)));
}

export function clearCart() {
  writeRaw([]);
}

export function viewCart(lines = readRaw()): CartItemView[] {
  const views: CartItemView[] = [];
  for (const line of lines) {
    const catalog = snapshotFromShowcase(line.slug);
    const name = asText(line.name) || catalog?.name || "";
    const image = asText(line.image) || catalog?.image || "";
    const sku = asText(line.sku) || catalog?.sku || line.slug;
    const unitPaisa = asText(line.unitPaisa) || catalog?.unitPaisa || "";
    if (!name || !unitPaisa) continue;
    let linePaisa: string;
    try {
      linePaisa = (BigInt(unitPaisa) * BigInt(line.qty)).toString();
    } catch {
      continue;
    }
    const comparePaisa =
      line.comparePaisa === undefined ? (catalog?.comparePaisa ?? null) : line.comparePaisa;
    views.push({
      ...line,
      name,
      image,
      sku,
      unitPaisa,
      comparePaisa,
      linePaisa,
    });
  }
  return views;
}
