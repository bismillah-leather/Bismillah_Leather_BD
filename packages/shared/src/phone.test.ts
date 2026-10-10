import { describe, expect, it } from "vitest";
import { normalizeBdPhone } from "./phone";

describe("normalizeBdPhone", () => {
  it("accepts the forms customers actually type", () => {
    expect(normalizeBdPhone("01712345678")).toBe("+8801712345678");
    expect(normalizeBdPhone("8801712345678")).toBe("+8801712345678");
    expect(normalizeBdPhone("+8801712345678")).toBe("+8801712345678");
    expect(normalizeBdPhone("01712-345-678")).toBe("+8801712345678");
  });

  it("rejects landlines, short numbers, and other countries", () => {
    expect(normalizeBdPhone("0212345678")).toBeNull();
    expect(normalizeBdPhone("0171234567")).toBeNull();
    expect(normalizeBdPhone("+14155552671")).toBeNull();
    expect(normalizeBdPhone("01112345678")).toBeNull();
  });
});
