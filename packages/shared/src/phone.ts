/** Bangladesh mobile numbers, stored as +8801XXXXXXXXX. */
const BD_MOBILE = /^\+8801[3-9]\d{8}$/;

export function normalizeBdPhone(input: string): string | null {
  const compact = input.trim().replace(/[\s()-]/g, "");
  let candidate = compact;

  if (candidate.startsWith("01")) candidate = `+88${candidate}`;
  else if (candidate.startsWith("880")) candidate = `+${candidate}`;
  else if (!candidate.startsWith("+880")) return null;

  return BD_MOBILE.test(candidate) ? candidate : null;
}
