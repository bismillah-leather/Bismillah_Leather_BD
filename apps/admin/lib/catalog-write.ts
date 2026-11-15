import { getPrisma } from "@bismillah/db";

type Db = ReturnType<typeof getPrisma>;
type Tx = Parameters<Parameters<Db["$transaction"]>[0]>[0];

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function ensureCategory(
  db: Tx | Db,
  input: { categoryId?: string; categoryName?: string },
) {
  const named = (input.categoryName ?? "").trim();
  if (!named && input.categoryId) {
    const found = await db.category.findFirst({
      where: { id: input.categoryId, deletedAt: null },
      select: { id: true },
    });
    if (found) return found.id;
  }

  const name = named || "Wallets";
  const slug = slugify(name) || "wallets";

  const existing = await db.category.findFirst({
    where: { deletedAt: null, OR: [{ slug }, { path: slug }, { name: { equals: name, mode: "insensitive" } }] },
    select: { id: true },
  });
  if (existing) return existing.id;

  let path = slug;
  for (let i = 2; i < 30; i++) {
    const clash = await db.category.findFirst({ where: { path }, select: { id: true } });
    if (!clash) break;
    path = `${slug}-${i}`.slice(0, 80);
  }

  const created = await db.category.create({
    data: { name, slug, path, isActive: true },
    select: { id: true },
  });
  return created.id;
}

export async function uniqueProductSlug(db: Tx | Db, base: string, exceptId?: string) {
  const root = slugify(base) || "product";
  for (let i = 0; i < 40; i++) {
    const slug = i === 0 ? root : `${root}-${i + 1}`.slice(0, 80);
    const clash = await db.product.findFirst({
      where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    });
    if (!clash) return slug;
  }
  return `${root}-${Date.now().toString(36)}`.slice(0, 80);
}

export async function uniqueSku(db: Tx | Db, base: string, exceptId?: string) {
  const root = base.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 48) || "BL-ITEM";
  for (let i = 0; i < 40; i++) {
    const sku = i === 0 ? root : `${root}-${i + 1}`.slice(0, 64);
    const clash = await db.productVariant.findFirst({
      where: { sku, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    });
    if (!clash) return sku;
  }
  return `${root}-${Date.now().toString(36)}`.slice(0, 64);
}
