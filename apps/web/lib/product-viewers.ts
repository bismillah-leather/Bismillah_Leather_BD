import { getPrisma, Prisma } from "@bismillah/db";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VISITOR = /^[0-9a-f-]{16,80}$/i;

let tableReady: Promise<void> | null = null;

function ensureTable() {
  if (!tableReady) {
    const prisma = getPrisma();
    tableReady = prisma
      .$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS product_presence (
          slug text NOT NULL,
          visitor_id text NOT NULL,
          seen_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (slug, visitor_id)
        )`,
      )
      .then(() =>
        prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS product_presence_seen_idx ON product_presence (seen_at)`,
        ),
      )
      .then(() => undefined)
      .catch((error: unknown) => {
        tableReady = null;
        throw error;
      });
  }
  return tableReady;
}

export function cleanViewerInput(visitorId: string, slugs: string[]) {
  if (!VISITOR.test(visitorId)) return null;
  const unique = [...new Set(slugs.map((slug) => slug.trim().toLowerCase()))].filter(
    (slug) => SLUG.test(slug) && slug.length <= 80,
  );
  return { visitorId, slugs: unique.slice(0, 40) };
}

/** Mark this visitor as looking at these products and return live counts. */
export async function syncProductViewers(
  visitorId: string,
  slugs: string[],
): Promise<Record<string, number> | null> {
  const cleaned = cleanViewerInput(visitorId, slugs);
  if (!cleaned) return null;

  try {
    await ensureTable();
    const prisma = getPrisma();
    await prisma.$executeRaw`DELETE FROM product_presence WHERE seen_at < now() - interval '20 seconds'`;

    if (cleaned.slugs.length === 0) {
      await prisma.$executeRaw`DELETE FROM product_presence WHERE visitor_id = ${cleaned.visitorId}`;
      return {};
    }

    await prisma.$executeRaw`
      INSERT INTO product_presence (slug, visitor_id, seen_at)
      VALUES ${Prisma.join(
        cleaned.slugs.map((slug) => Prisma.sql`(${slug}, ${cleaned.visitorId}, now())`),
      )}
      ON CONFLICT (slug, visitor_id) DO UPDATE SET seen_at = now()
    `;
    await prisma.$executeRaw`
      DELETE FROM product_presence
      WHERE visitor_id = ${cleaned.visitorId}
        AND slug NOT IN (${Prisma.join(cleaned.slugs)})
    `;

    const rows = await prisma.$queryRaw<Array<{ slug: string; viewers: number }>>`
      SELECT slug, count(*)::int AS viewers
      FROM product_presence
      WHERE seen_at >= now() - interval '20 seconds'
        AND slug IN (${Prisma.join(cleaned.slugs)})
      GROUP BY slug
    `;

    const counts: Record<string, number> = {};
    for (const slug of cleaned.slugs) counts[slug] = 0;
    for (const row of rows) counts[row.slug] = Number(row.viewers);
    return counts;
  } catch (error) {
    console.error("[web] product viewers failed:", error);
    return null;
  }
}
