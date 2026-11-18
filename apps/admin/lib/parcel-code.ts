const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function compact(raw?: string | null) {
  const value = (raw ?? "").trim();
  if (!value || UUID.test(value)) return "";
  if (value.length > 32) return "";
  return value;
}

/**
 * Steadfast invoice barcode is the numeric consignment ID (e.g. 322153136).
 * Tracking (SF…BD) is only a fallback if consignment is missing.
 */
export function parcelBarcodeValue(consignmentId?: string | null, trackingCode?: string | null) {
  const consignment = compact(consignmentId);
  const digits = consignment.replace(/\D/g, "");
  if (digits.length >= 6) return digits;
  const tracking = compact(trackingCode);
  if (tracking) return tracking;
  return consignment;
}

/** Same ID Steadfast prints under the barcode and as SF-ID. */
export function parcelShortId(consignmentId?: string | null, trackingCode?: string | null) {
  return parcelBarcodeValue(consignmentId, trackingCode);
}
