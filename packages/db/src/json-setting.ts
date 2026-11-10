import { getPrisma } from "./client";
import { Prisma } from "./generated/prisma/client";

export async function readJsonSetting(key: string): Promise<Prisma.JsonValue | null> {
  const row = await getPrisma().setting.findUnique({
    where: { key },
    select: { value: true },
  });
  return row?.value ?? null;
}

export async function writeJsonSetting(key: string, value: Prisma.InputJsonValue): Promise<void> {
  await getPrisma().setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
