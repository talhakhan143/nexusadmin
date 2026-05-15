import { z } from "zod";

export const customerSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().max(100).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  acceptsMarketing: z.boolean().default(false),
  notes: z.string().max(2000).optional().nullable(),
});
export type CustomerInput = z.infer<typeof customerSchema>;

export const addressSchema = z.object({
  type: z.enum(["BILLING", "SHIPPING", "BOTH"]).default("BOTH"),
  firstName: z.string().max(80).optional().nullable(),
  lastName: z.string().max(80).optional().nullable(),
  company: z.string().max(120).optional().nullable(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional().nullable(),
  country: z.string().min(2).max(2).or(z.string().min(2).max(80)),
  postalCode: z.string().min(1).max(20),
  phone: z.string().max(40).optional().nullable(),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const customerQuerySchema = z.object({
  q: z.string().optional(),
  segment: z.enum(["all", "new", "repeat", "vip", "marketing"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["createdAt", "name", "totalSpent", "ordersCount"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type CustomerQuery = z.infer<typeof customerQuerySchema>;
