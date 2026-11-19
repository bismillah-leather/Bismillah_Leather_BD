import { BRAND } from "@bismillah/shared";
import { getPrisma, publicEpsConfig, readEpsConfig, readSeoConfig } from "@bismillah/db";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-page-header";
import { requireAdmin } from "@/lib/admin-auth";
import { EpsSettingsForm } from "./eps-settings-form";
import { SeoSettingsForm } from "./seo-settings-form";
import { SettingsForm } from "./settings-form";

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

export default async function SettingsPage() {
  const prisma = getPrisma();
  const [, rows, eps, seo] = await Promise.all([
    requireAdmin(),
    prisma.setting.findMany({
    where: {
      key: {
        in: [
          "store.name",
          "store.supportPhone",
          "store.supportWhatsapp",
          "store.email",
          "store.facebookUrl",
          "store.youtubeUrl",
          "store.codNote",
          "store.announcement",
          "store.shippingNote",
          "store.address",
          "store.addressShort",
        ],
      },
    },
    }),
    readEpsConfig(),
    readSeoConfig(),
  ]);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div>
      <AdminPageHeader
        eyebrow="Store"
        title="Settings"
        description="Phone, WhatsApp, address, EPS, and Google / pixel tracking for search."
      />
      <p className="mt-4 text-sm text-muted-foreground">
        <Link href="/products" className="text-primary hover:underline">
          Manage products
        </Link>
        {" · "}
        <Link href="/account" className="text-primary hover:underline">
          Change password
        </Link>
        {" · "}
        <Link href="/team" className="text-primary hover:underline">
          Manage team
        </Link>
      </p>
      <SettingsForm
        initial={{
          name: asString(map["store.name"], BRAND.name),
          supportPhone: asString(map["store.supportPhone"], BRAND.phoneDisplay),
          supportWhatsapp: asString(map["store.supportWhatsapp"], "8801957876157"),
          email: asString(map["store.email"], BRAND.email),
          facebookUrl: asString(map["store.facebookUrl"], BRAND.facebookUrl),
          youtubeUrl: asString(map["store.youtubeUrl"], BRAND.youtubeUrl),
          codNote: asString(
            map["store.codNote"],
            "Cash on delivery available in Dhaka. We call before packing.",
          ),
          announcement: asString(map["store.announcement"], ""),
          shippingNote: asString(
            map["store.shippingNote"],
            "Dhaka delivery 1–2 days. Outside Dhaka 2–4 days after confirmation.",
          ),
          address: asString(map["store.address"], BRAND.addressLine),
          addressShort: asString(map["store.addressShort"], BRAND.addressShort),
        }}
      />
      <EpsSettingsForm initial={publicEpsConfig(eps)} />
      <SeoSettingsForm initial={seo} />
    </div>
  );
}
