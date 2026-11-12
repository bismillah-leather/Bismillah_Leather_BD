import { normalizeLandingList, type LandingPage } from "@bismillah/shared";
import { readJsonSetting, writeJsonSetting } from "./json-setting";

const KEY = "landing_pages";

export async function readLandingPages(): Promise<LandingPage[]> {
  const stored = await readJsonSetting(KEY);
  return normalizeLandingList(stored);
}

export async function writeLandingPages(value: unknown): Promise<LandingPage[]> {
  const pages = normalizeLandingList(value);
  await writeJsonSetting(KEY, pages);
  return pages;
}

export async function readPublishedLanding(slug: string): Promise<LandingPage | null> {
  const pages = await readLandingPages();
  return pages.find((page) => page.published && page.slug === slug) ?? null;
}
