import { readLandingPages } from "@bismillah/db";
import { requireAdmin } from "@/lib/admin-auth";
import { requestStoreOrigin } from "@/lib/media-url";
import { LandingStudio } from "./landing-studio";

export default async function LandingsPage() {
  await requireAdmin();
  const [pages, storeOrigin] = await Promise.all([readLandingPages(), requestStoreOrigin()]);
  return <LandingStudio initial={pages} storeOrigin={storeOrigin} />;
}
