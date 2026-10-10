/** 1 BDT = 100 paisa. Money is always an integer. Never a float. */
export const PAISA_PER_TAKA = 100n;

const TAKA_PATTERN = /^-?\d+(\.\d{1,2})?$/;

export function parseTakaToPaisa(input: string): bigint {
  const trimmed = input.trim().replace(/,/g, "").replace(/^৳/, "");
  if (!TAKA_PATTERN.test(trimmed)) {
    throw new Error(`Invalid taka amount: ${input}`);
  }

  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  const paisa = BigInt(whole) * PAISA_PER_TAKA + BigInt(fraction.padEnd(2, "0"));
  return negative ? -paisa : paisa;
}

export function formatPaisa(paisa: bigint): string {
  const negative = paisa < 0n;
  const absolute = negative ? -paisa : paisa;
  const taka = absolute / PAISA_PER_TAKA;
  const fraction = (absolute % PAISA_PER_TAKA).toString().padStart(2, "0");
  const grouped = taka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}৳${grouped}.${fraction}`;
}

/** Percent off, in basis points. 15% = 1500. Result is rounded half away from zero to paisa. */
export function percentOff(amountPaisa: bigint, basisPoints: bigint): bigint {
  if (basisPoints < 0n || basisPoints > 10_000n) {
    throw new Error("Basis points must be between 0 and 10000");
  }
  const negative = amountPaisa < 0n;
  const absolute = negative ? -amountPaisa : amountPaisa;
  const product = absolute * basisPoints;
  const discount = (product + 5_000n) / 10_000n;
  return negative ? -discount : discount;
}

export function clampDiscount(discountPaisa: bigint, maxDiscountPaisa: bigint | null): bigint {
  if (discountPaisa < 0n) return 0n;
  if (maxDiscountPaisa == null) return discountPaisa;
  return discountPaisa > maxDiscountPaisa ? maxDiscountPaisa : discountPaisa;
}
