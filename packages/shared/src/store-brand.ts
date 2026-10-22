import { BRAND } from "./brand";

/** Editable storefront contact + brand fields (admin Settings). */
export type StoreBrand = {
  name: string;
  shortName: string;
  tagline: string;
  taglineBn: string;
  phoneDisplay: string;
  phoneE164: string;
  whatsappUrl: string;
  email: string;
  facebookUrl: string;
  addressLine: string;
  addressShort: string;
  followersLabel: string;
  recommendLabel: string;
  categoryLabel: string;
  codNote: string;
  shippingNote: string;
  announcement: string;
};

export function digitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

/** Normalize BD mobile to E.164 (+880…) and wa.me URL. */
export function contactFromPhoneFields(input: {
  phoneDisplay?: string;
  whatsappDigits?: string;
}): Pick<StoreBrand, "phoneDisplay" | "phoneE164" | "whatsappUrl"> {
  const display = (input.phoneDisplay?.trim() || BRAND.phoneDisplay).trim();
  const waRaw = digitsOnly(input.whatsappDigits?.trim() || display);
  let national = waRaw;
  if (national.startsWith("880")) national = national.slice(3);
  if (national.startsWith("0")) national = national.slice(1);
  if (!national.startsWith("1") || national.length < 10) {
    return {
      phoneDisplay: display,
      phoneE164: BRAND.phoneE164,
      whatsappUrl: BRAND.whatsappUrl,
    };
  }
  return {
    phoneDisplay: display,
    phoneE164: `+880${national}`,
    whatsappUrl: `https://wa.me/880${national}`,
  };
}

export function defaultStoreBrand(): StoreBrand {
  return {
    name: BRAND.name,
    shortName: BRAND.shortName,
    tagline: BRAND.tagline,
    taglineBn: BRAND.taglineBn,
    phoneDisplay: BRAND.phoneDisplay,
    phoneE164: BRAND.phoneE164,
    whatsappUrl: BRAND.whatsappUrl,
    email: BRAND.email,
    facebookUrl: BRAND.facebookUrl,
    addressLine: BRAND.addressLine,
    addressShort: BRAND.addressShort,
    followersLabel: BRAND.followersLabel,
    recommendLabel: BRAND.recommendLabel,
    categoryLabel: BRAND.categoryLabel,
    codNote: "Cash on delivery available in Dhaka. We call before packing.",
    shippingNote: "Dhaka delivery 1–2 days. Outside Dhaka 2–4 days after confirmation.",
    announcement: "",
  };
}
