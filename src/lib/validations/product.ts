import { z } from "zod";

export const productStatusEnum = z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]);

export const variantOptionSchema = z.object({
  name: z.string().min(1, "Option name required"),
  value: z.string().min(1, "Option value required"),
});

export const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  price: z.number().int().nonnegative("Price must be ≥ 0"),
  compareAtPrice: z.number().int().nonnegative().optional().nullable(),
  costPrice: z.number().int().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  weight: z.number().nonnegative().optional().nullable(),
  image: z.string().url().optional().nullable().or(z.literal("")),
  position: z.number().int().default(0),
  options: z.array(variantOptionSchema).default([]),
});

export const productImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional().nullable(),
  position: z.number().int().default(0),
});

export const productSchema = z.object({
  name: z.string().min(2, "Name too short").max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  sku: z.string().optional().nullable(),
  status: productStatusEnum.default("DRAFT"),
  basePrice: z.number().int().nonnegative("Price must be ≥ 0"),
  compareAtPrice: z.number().int().nonnegative().optional().nullable(),
  costPrice: z.number().int().nonnegative().optional().nullable(),
  taxable: z.boolean().default(true),
  weight: z.number().nonnegative().optional().nullable(),
  trackInventory: z.boolean().default(true),
  featured: z.boolean().default(false),
  categoryId: z.string().optional().nullable(),
  metaTitle: z.string().max(100).optional().nullable(),
  metaDescription: z.string().max(300).optional().nullable(),
  ogImage: z.string().url().optional().nullable().or(z.literal("")),
  images: z.array(productImageSchema).default([]),
  variants: z.array(variantSchema).default([]),
  tagIds: z.array(z.string()).default([]),
});

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;

export const productQuerySchema = z.object({
  q: z.string().optional(),
  status: productStatusEnum.optional(),
  categoryId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["createdAt", "name", "basePrice", "updatedAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;
