export function courierTrackingUrl(
  courier: "steadfast" | "pathao",
  code: string,
  phone?: string,
) {
  const id = code.trim();
  if (!id) return "";
  if (courier === "steadfast") {
    return `https://steadfast.com.bd/track/consignment/${encodeURIComponent(id)}`;
  }
  const params = new URLSearchParams({ consignment_id: id });
  const local = bdMobile11(phone ?? "");
  if (local) params.set("phone", local);
  return `https://merchant.pathao.com/tracking?${params.toString()}`;
}

export function bdMobile11(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("8801") && digits.length === 13) return `0${digits.slice(3)}`;
  if (digits.startsWith("01") && digits.length === 11) return digits;
  return "";
}
