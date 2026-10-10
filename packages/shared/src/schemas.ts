import { z } from "zod";
import { normalizeBdPhone } from "./phone";

export const takaAmountSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter an amount like 1250 or 1250.50");

export const bdPhoneSchema = z.string().trim().transform((value, ctx) => {
  const normalized = normalizeBdPhone(value);
  if (!normalized) {
    ctx.addIssue({
      code: "custom",
      message: "Enter a Bangladesh mobile number",
    });
    return z.NEVER;
  }
  return normalized;
});

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens");
