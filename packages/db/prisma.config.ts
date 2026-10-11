import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI (migrate / studio / seed) should use a direct TCP URL.
 * Runtime queries use DATABASE_URL (pooled) via getPrisma().
 *
 * Prisma Postgres:
 *   DATABASE_URL  = pooled  (…@pooled.db.prisma.io…)
 *   DIRECT_URL    = direct  (…@db.prisma.io…)
 *
 * Local Docker: both can be the same localhost Postgres URL.
 */
const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!datasourceUrl) {
  throw new Error("Set DIRECT_URL or DATABASE_URL for Prisma CLI");
}

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
});
