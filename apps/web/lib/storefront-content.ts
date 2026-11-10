import { getPrisma } from "@bismillah/db";
import { POLICY_SLUGS, readStorefrontDraft, type StorefrontDraft } from "@bismillah/shared";
import { cache } from "react";
import { remember } from "./remember";

export const getStorefrontContent = cache(async (): Promise<StorefrontDraft> => {
  return remember("storefront-content", 20_000, async () => {
  try {
    const prisma = getPrisma();
    const [sections, pages] = await Promise.all([
      prisma.homeSection.findMany({
        where: { key: { in: ["hero", "about", "trust", "featured"] }, isActive: true },
        select: { key: true, payload: true },
      }),
      prisma.page.findMany({
        where: { slug: { in: [...POLICY_SLUGS] }, isPublished: true },
        select: { slug: true, title: true, body: true },
      }),
    ]);
    return readStorefrontDraft({ sections, pages });
  } catch (error) {
    console.error("[web] storefront content fell back to defaults:", error);
    return readStorefrontDraft({});
  }
  });
});
