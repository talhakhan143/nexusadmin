import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().optional().nullable(),
  image: z.string().url().optional().nullable().or(z.literal("")),
  parentId: z.string().optional().nullable(),
  position: z.number().int().default(0),
  metaTitle: z.string().max(100).optional().nullable(),
  metaDescription: z.string().max(300).optional().nullable(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const tagSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
});
export type TagInput = z.infer<typeof tagSchema>;
