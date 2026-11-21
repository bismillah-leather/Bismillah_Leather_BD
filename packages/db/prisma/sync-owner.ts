import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { getPrisma } from "../src/client";

const PLACEHOLDERS = new Set(["", "unused-do-not-seed", "dev-only-change-me"]);

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (!email.includes("@")) {
    throw new Error("SEED_ADMIN_EMAIL is missing");
  }
  if (PLACEHOLDERS.has(password) || password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD is missing or still a placeholder");
  }

  const prisma = getPrisma();
  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await prisma.adminUser.upsert({
    where: { email },
    create: {
      email,
      name: "Owner",
      passwordHash,
      role: "owner",
      isActive: true,
    },
    update: {
      passwordHash,
      isActive: true,
      role: "owner",
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  const row = await prisma.adminUser.findUnique({
    where: { email },
    select: { email: true, role: true, isActive: true },
  });
  console.log("OWNER_SYNC_OK", row?.email, row?.role, row?.isActive);
}

const prisma = getPrisma();
main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
