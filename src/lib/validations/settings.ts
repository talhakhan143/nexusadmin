import { z } from "zod";

export const storeSchema = z.object({
  name: z.string().min(2).max(120),
  legalName: z.string().max(160).optional().nullable(),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  logo: z.string().url().optional().nullable().or(z.literal("")),
  favicon: z.string().url().optional().nullable().or(z.literal("")),
  currency: z.string().length(3),
  locale: z.string().min(2).max(10),
  timezone: z.string().max(50),
  taxRate: z.number().min(0).max(100),
  taxIncluded: z.boolean().default(false),
  addressLine1: z.string().max(200).optional().nullable(),
  addressLine2: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  socialFacebook: z.string().url().optional().nullable().or(z.literal("")),
  socialInstagram: z.string().url().optional().nullable().or(z.literal("")),
  socialTwitter: z.string().url().optional().nullable().or(z.literal("")),
});
export type StoreInput = z.infer<typeof storeSchema>;

export const teamUserSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional().nullable(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "VIEWER"]),
  password: z.string().min(8).optional().nullable(),
});
export type TeamUserInput = z.infer<typeof teamUserSchema>;

export const apiKeySchema = z.object({
  name: z.string().min(2).max(80),
  scopes: z.array(z.string()).min(1, "Pick at least one scope"),
  expiresAt: z.string().optional().nullable(),
});
export type ApiKeyInput = z.infer<typeof apiKeySchema>;

export const emailSettingsSchema = z.object({
  fromName: z.string().max(80),
  fromAddress: z.string().email(),
  replyTo: z.string().email().optional().nullable().or(z.literal("")),
});
export type EmailSettingsInput = z.infer<typeof emailSettingsSchema>;
