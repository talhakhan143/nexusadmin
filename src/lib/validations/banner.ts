import { z } from "zod";

export const bannerPlacementEnum = z.enum([
  "HOMEPAGE_HERO",
  "HOMEPAGE_SECONDARY",
  "HOMEPAGE_FOOTER",
  "CATEGORY_TOP",
  "PRODUCT_DETAIL_SIDE",
  "CART_SIDEBAR",
  "CHECKOUT_TOP",
  "POPUP",
  "CUSTOM",
]);
export type BannerPlacementValue = z.infer<typeof bannerPlacementEnum>;

export const PLACEMENT_LABEL: Record<BannerPlacementValue, string> = {
  HOMEPAGE_HERO: "Homepage hero",
  HOMEPAGE_SECONDARY: "Homepage secondary",
  HOMEPAGE_FOOTER: "Homepage footer",
  CATEGORY_TOP: "Category top",
  PRODUCT_DETAIL_SIDE: "Product detail sidebar",
  CART_SIDEBAR: "Cart sidebar",
  CHECKOUT_TOP: "Checkout notice",
  POPUP: "Popup / modal",
  CUSTOM: "Custom (free-form key)",
};

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{3,8}$/, "Must be a hex color, e.g. #0f172a")
  .optional()
  .nullable()
  .or(z.literal(""));

export const bannerSchema = z
  .object({
    name: z.string().min(2).max(120),
    placement: bannerPlacementEnum,
    customKey: z
      .string()
      .max(60)
      .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only")
      .optional()
      .nullable()
      .or(z.literal("")),
    title: z.string().max(200).optional().nullable(),
    subtitle: z.string().max(400).optional().nullable(),
    ctaText: z.string().max(60).optional().nullable(),
    ctaUrl: z.string().url().optional().nullable().or(z.literal("")),
    image: z.string().url("Image URL required"),
    imageMobile: z.string().url().optional().nullable().or(z.literal("")),
    alt: z.string().max(200).optional().nullable(),
    bgColor: hexColor,
    textColor: hexColor,
    linkUrl: z.string().url().optional().nullable().or(z.literal("")),
    targetCategoryId: z.string().optional().nullable(),
    targetProductId: z.string().optional().nullable(),
    startsAt: z.string().optional().nullable(),
    endsAt: z.string().optional().nullable(),
    position: z.number().int().nonnegative().default(0),
    isActive: z.boolean().default(true),
  })
  .superRefine((d, ctx) => {
    if (d.placement === "CUSTOM" && !d.customKey) {
      ctx.addIssue({ code: "custom", message: "customKey required for CUSTOM placement", path: ["customKey"] });
    }
    if (d.startsAt && d.endsAt && new Date(d.startsAt) > new Date(d.endsAt)) {
      ctx.addIssue({ code: "custom", message: "Starts must be before ends", path: ["endsAt"] });
    }
  });
export type BannerInput = z.infer<typeof bannerSchema>;
