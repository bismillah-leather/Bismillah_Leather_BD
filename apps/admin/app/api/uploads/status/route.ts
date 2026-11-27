import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { NO_STORE_HEADERS } from "@/lib/no-store";
import { isUsableR2PublicBase, missingR2EnvNames, readR2Config } from "@/lib/r2";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Runtime R2 probe. No secrets. Must not be cached by a CDN. */
export async function GET() {
  const admin = await getActiveAdmin();
  const config = readR2Config();
  const missing = missingR2EnvNames();
  const publicBase = config?.publicBase ?? "";
  let publicHost = "";
  try {
    publicHost = publicBase ? new URL(publicBase).host : "";
  } catch {
    publicHost = "";
  }

  return NextResponse.json(
    {
      ok: true,
      configured: Boolean(config) && isUsableR2PublicBase(publicBase),
      signedIn: Boolean(admin),
      missingCount: missing.length,
      publicHost,
      usablePublicBase: publicBase ? isUsableR2PublicBase(publicBase) : false,
    },
    { headers: NO_STORE_HEADERS },
  );
}
