import { getPrisma } from "@bismillah/db";
import {
  BRAND,
  contactFromPhoneFields,
  defaultStoreBrand,
  type StoreBrand,
} from "@bismillah/shared";
import { cache } from "react";

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

export const getStoreBrand = cache(async (): Promise<StoreBrand> => {
  const base = defaultStoreBrand();
  try {
    const prisma = getPrisma();
    const rows = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "store.supportPhone",
            "store.supportWhatsapp",
            "store.email",
            "store.facebookUrl",
            "store.address",
            "store.addressShort",
            "store.codNote",
            "store.shippingNote",
            "store.announcement",
            "store.name",
          ],
        },
      },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const phone = contactFromPhoneFields({
      phoneDisplay: asString(map["store.supportPhone"], base.phoneDisplay),
      whatsappDigits: asString(map["store.supportWhatsapp"], base.phoneE164),
    });

    return {
      ...base,
      name: asString(map["store.name"], base.name) || base.name,
      ...phone,
      email: asString(map["store.email"], base.email) || base.email,
      facebookUrl: asString(map["store.facebookUrl"], base.facebookUrl) || base.facebookUrl,
      addressLine: asString(map["store.address"], base.addressLine) || base.addressLine,
      addressShort:
        asString(map["store.addressShort"], base.addressShort) || base.addressShort,
      codNote: asString(map["store.codNote"], base.codNote),
      shippingNote: asString(map["store.shippingNote"], base.shippingNote),
      announcement: asString(map["store.announcement"], base.announcement),
    };
  } catch {
    return { ...base, name: BRAND.name };
  }
});
