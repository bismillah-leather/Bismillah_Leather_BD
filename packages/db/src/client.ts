import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { Pool } from "pg";
import { loadRootEnv } from "./load-root-env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; pool?: Pool };

function poolMax() {
  // One warm isolate must not open a fresh pool on every query.
  if (process.env.VERCEL === "1") return 2;
  if (process.env.NODE_ENV === "production") return 5;
  return 10;
}

export function createPrismaClient(connectionString: string): PrismaClient {
  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString,
      max: poolMax(),
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 15_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 3_000,
    });
  globalForPrisma.pool = pool;

  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  loadRootEnv();

  // Prefer pooled URL at runtime (Prisma Postgres / PgBouncer). Fall back to DATABASE_URL.
  const connectionString = process.env.DATABASE_POOL_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL (or DATABASE_POOL_URL) is not set");
  }

  const client = createPrismaClient(connectionString);
  globalForPrisma.prisma = client;
  return client;
}
