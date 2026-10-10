import { describe, expect, it } from "vitest";
import { clampDiscount, formatPaisa, parseTakaToPaisa, percentOff } from "./money";

describe("parseTakaToPaisa", () => {
  it("converts whole taka and two-decimal amounts", () => {
    expect(parseTakaToPaisa("0")).toBe(0n);
    expect(parseTakaToPaisa("1")).toBe(100n);
    expect(parseTakaToPaisa("1250")).toBe(125_000n);
    expect(parseTakaToPaisa("1250.5")).toBe(125_050n);
    expect(parseTakaToPaisa("1250.50")).toBe(125_050n);
    expect(parseTakaToPaisa("৳1,250.50")).toBe(125_050n);
  });

  it("rejects floats that would lose paisa", () => {
    expect(() => parseTakaToPaisa("10.999")).toThrow(/Invalid taka amount/);
    expect(() => parseTakaToPaisa("10.5.0")).toThrow(/Invalid taka amount/);
    expect(() => parseTakaToPaisa("abc")).toThrow(/Invalid taka amount/);
  });
});

describe("formatPaisa", () => {
  it("renders BDT with grouping", () => {
    expect(formatPaisa(125_050n)).toBe("৳1,250.50");
    expect(formatPaisa(0n)).toBe("৳0.00");
    expect(formatPaisa(-50n)).toBe("-৳0.50");
  });
});

describe("percentOff", () => {
  it("rounds half away from zero", () => {
    expect(percentOff(10_000n, 1500n)).toBe(1_500n);
    expect(percentOff(1n, 5000n)).toBe(1n);
    expect(percentOff(1n, 4999n)).toBe(0n);
  });
});

describe("clampDiscount", () => {
  it("never returns a negative discount and respects the cap", () => {
    expect(clampDiscount(-1n, null)).toBe(0n);
    expect(clampDiscount(500n, 200n)).toBe(200n);
    expect(clampDiscount(500n, null)).toBe(500n);
  });
});
