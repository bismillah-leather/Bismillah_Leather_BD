import { loadRootEnv } from "./load-root-env";
import { readJsonSetting, writeJsonSetting } from "./json-setting";

export type SeoConfig = {
  gtmId: string;
  ga4Id: string;
  googleAdsId: string;
  googleSiteVerification: string;
  bingSiteVerification: string;
  facebookPixelId: string;
  tiktokPixelId: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

const KEY = "seo.tracking";

const DEFAULT_KEYWORDS =
  "leather wallet bangladesh, genuine leather wallet dhaka, buffalo leather wallet, leather belt bangladesh, men's leather wallet, RFID wallet, bismillah leather, mirpur leather shop, cash on delivery wallet, leather long wallet";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function fromRecord(row: Record<string, unknown>, env: NodeJS.ProcessEnv): SeoConfig {
  return {
    gtmId: text(row.gtmId) || text(env.NEXT_PUBLIC_GTM_ID),
    ga4Id: text(row.ga4Id) || text(env.NEXT_PUBLIC_GA_ID) || text(env.GA_MEASUREMENT_ID),
    googleAdsId: text(row.googleAdsId) || text(env.NEXT_PUBLIC_GOOGLE_ADS_ID),
    googleSiteVerification:
      text(row.googleSiteVerification) || text(env.GOOGLE_SITE_VERIFICATION),
    bingSiteVerification: text(row.bingSiteVerification) || text(env.BING_SITE_VERIFICATION),
    facebookPixelId: text(row.facebookPixelId) || text(env.NEXT_PUBLIC_FB_PIXEL_ID),
    tiktokPixelId: text(row.tiktokPixelId) || text(env.NEXT_PUBLIC_TIKTOK_PIXEL_ID),
    seoTitle: text(row.seoTitle),
    seoDescription: text(row.seoDescription),
    seoKeywords: text(row.seoKeywords) || DEFAULT_KEYWORDS,
  };
}

export async function readSeoConfig(): Promise<SeoConfig> {
  loadRootEnv();
  const stored = await readJsonSetting(KEY);
  const row =
    stored && typeof stored === "object" && !Array.isArray(stored)
      ? (stored as Record<string, unknown>)
      : {};
  return fromRecord(row, process.env);
}

export async function writeSeoConfig(patch: Partial<SeoConfig>): Promise<SeoConfig> {
  const current = await readSeoConfig();
  const next: SeoConfig = {
    gtmId: patch.gtmId !== undefined ? text(patch.gtmId) : current.gtmId,
    ga4Id: patch.ga4Id !== undefined ? text(patch.ga4Id) : current.ga4Id,
    googleAdsId: patch.googleAdsId !== undefined ? text(patch.googleAdsId) : current.googleAdsId,
    googleSiteVerification:
      patch.googleSiteVerification !== undefined
        ? text(patch.googleSiteVerification)
        : current.googleSiteVerification,
    bingSiteVerification:
      patch.bingSiteVerification !== undefined
        ? text(patch.bingSiteVerification)
        : current.bingSiteVerification,
    facebookPixelId:
      patch.facebookPixelId !== undefined ? text(patch.facebookPixelId) : current.facebookPixelId,
    tiktokPixelId:
      patch.tiktokPixelId !== undefined ? text(patch.tiktokPixelId) : current.tiktokPixelId,
    seoTitle: patch.seoTitle !== undefined ? text(patch.seoTitle) : current.seoTitle,
    seoDescription:
      patch.seoDescription !== undefined ? text(patch.seoDescription) : current.seoDescription,
    seoKeywords: patch.seoKeywords !== undefined ? text(patch.seoKeywords) : current.seoKeywords,
  };
  await writeJsonSetting(KEY, next);
  return next;
}
