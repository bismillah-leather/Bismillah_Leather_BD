import { productBySlug } from "@bismillah/shared";

export type CartLine = {
  slug: string;
  color: string;
  qty: number;
};

export type CartItemView = CartLine & {
  name: string;
  image: string;
  sku: string;
  unitPaisa: string;
  comparePaisa: string | null;
  linePaisa: string;
};

const STORAGE_KEY = "bl-cart-v1";
const EMPTY_LINES: CartLine[] = [];
let cached: CartLine[] = EMPTY_LINES;
let cacheReady = false;

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

export function addToCart(slug: string, color: string, qty = 1, opts?: { openDrawer?: boolean }) {
  const product = productBySlug(slug);
  if (!product || !product.inStock) return false;
  const safeQty = Math.max(1, Math.min(5, Math.floor(qty)));
  const lines = [...readRaw()];
  const index = lines.findIndex((line) => line.slug === slug && line.color === color);
  if (index >= 0) {
    const current = lines[index]!;
    lines[index] = { ...current, qty: Math.min(5, current.qty + safeQty) };
  } else {
    lines.push({ slug, color, qty: safeQty });
  }
  writeRaw(lines);
  if (opts?.openDrawer !== false && typeof window !== "undefined") {
    window.dispatchEvent(new Event("bl-cart-open"));
  }
  return true;
}

/** Add item then go to checkout (Buy now). */
export function buyNow(slug: string, color: string, qty = 1) {
  const ok = addToCart(slug, color, qty);
  if (!ok || typeof window === "undefined") return false;
  window.location.assign("/checkout");
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
    const product = productBySlug(line.slug);
    if (!product) continue;
    const unit = product.salePaisa ?? product.pricePaisa;
    views.push({
      ...line,
      name: String(product.name),
      image: product.image,
      sku: product.sku,
      unitPaisa: unit.toString(),
      comparePaisa: product.salePaisa ? product.pricePaisa.toString() : null,
      linePaisa: (unit * BigInt(line.qty)).toString(),
    });
  }
  return views;
}
