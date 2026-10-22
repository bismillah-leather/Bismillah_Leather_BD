import { getPrisma } from "@bismillah/db";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-page-header";
import { requireAdmin } from "@/lib/admin-auth";
import { SettingsForm } from "./settings-form";

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

export default async function SettingsPage() {
  await requireAdmin();
  const prisma = getPrisma();
  const rows = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          "store.supportPhone",
          "store.supportWhatsapp",
          "store.codNote",
          "store.announcement",
          "store.shippingNote",
          "store.address",
        ],
      },
    },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div>
      <AdminPageHeader
        eyebrow="Store"
        title="Settings"
        description="Support contacts and storefront notes. Password and staff live under Account / Team."
      />
      <p className="mt-4 text-sm text-muted-foreground">
        <Link href="/account" className="text-primary hover:underline">
          Change your password
        </Link>
        {" · "}
        <Link href="/team" className="text-primary hover:underline">
          Manage team
        </Link>
      </p>
      <SettingsForm
        initial={{
          supportPhone: asString(map["store.supportPhone"], "01700000000"),
          supportWhatsapp: asString(map["store.supportWhatsapp"], "8801700000000"),
          codNote: asString(
            map["store.codNote"],
            "Cash on delivery available in Dhaka. We call before packing.",
          ),
          announcement: asString(map["store.announcement"], ""),
          shippingNote: asString(
            map["store.shippingNote"],
            "Dhaka delivery 1–2 days. Outside Dhaka 2–4 days after confirmation.",
          ),
          address: asString(map["store.address"], "Mirpur-10, Dhaka"),
        }}
      />
    </div>
  );
}
