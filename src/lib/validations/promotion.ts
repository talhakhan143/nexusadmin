import { z } from "zod";

export const couponTypeEnum = z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]);
export const couponScopeEnum = z.enum(["ALL", "PRODUCTS", "CATEGORIES"]);

export const couponSchema = z
  .object({
    code: z
      .string()
      .min(2)
      .max(40)
      .regex(/^[A-Z0-9_-]+$/, "Uppercase letters, numbers, _, - only"),
    description: z.string().max(300).optional().nullable(),
    type: couponTypeEnum,
    value: z.number().int().nonnegative(),
    minPurchase: z.number().int().nonnegative().optional().nullable(),
    maxDiscount: z.number().int().nonnegative().optional().nullable(),
    usageLimit: z.number().int().positive().optional().nullable(),
    perCustomerLimit: z.number().int().positive().optional().nullable(),
    scope: couponScopeEnum.default("ALL"),
    productIds: z.array(z.string()).default([]),
    categoryIds: z.array(z.string()).default([]),
    startsAt: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.type === "PERCENTAGE" && (data.value < 0 || data.value > 100)) {
      ctx.addIssue({ code: "custom", message: "Percentage must be 0–100", path: ["value"] });
    }
    if (data.type === "FREE_SHIPPING" && data.value !== 0) {
      ctx.addIssue({ code: "custom", message: "Value must be 0 for free shipping", path: ["value"] });
    }
    if (data.scope === "PRODUCTS" && data.productIds.length === 0) {
      ctx.addIssue({ code: "custom", message: "Select at least one product", path: ["productIds"] });
    }
    if (data.scope === "CATEGORIES" && data.categoryIds.length === 0) {
      ctx.addIssue({ code: "custom", message: "Select at least one category", path: ["categoryIds"] });
    }
    if (data.startsAt && data.expiresAt && new Date(data.startsAt) > new Date(data.expiresAt)) {
      ctx.addIssue({ code: "custom", message: "Start date must be before expiry", path: ["expiresAt"] });
    }
  });
export type CouponInput = z.infer<typeof couponSchema>;

export const flashSaleSchema = z
  .object({
    name: z.string().min(2).max(120),
    description: z.string().max(500).optional().nullable(),
    startsAt: z.string().min(1, "Required"),
    endsAt: z.string().min(1, "Required"),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    discountValue: z.number().int().nonnegative(),
    isActive: z.boolean().default(true),
    productIds: z.array(z.string()).min(1, "Select at least one product"),
  })
  .superRefine((data, ctx) => {
    if (new Date(data.startsAt) >= new Date(data.endsAt)) {
      ctx.addIssue({ code: "custom", message: "End must be after start", path: ["endsAt"] });
    }
    if (data.discountType === "PERCENTAGE" && (data.discountValue < 0 || data.discountValue > 100)) {
      ctx.addIssue({ code: "custom", message: "Percentage must be 0–100", path: ["discountValue"] });
    }
  });
export type FlashSaleInput = z.infer<typeof flashSaleSchema>;
