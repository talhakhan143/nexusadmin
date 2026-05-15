import { z } from "zod";

export const checkoutAddressSchema = z.object({
  firstName: z.string().max(80).optional().nullable(),
  lastName: z.string().max(80).optional().nullable(),
  company: z.string().max(120).optional().nullable(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional().nullable(),
  country: z.string().min(2).max(80),
  postalCode: z.string().min(1).max(20),
  phone: z.string().max(40).optional().nullable(),
});

export const checkoutItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive().max(999),
});

export const checkoutSchema = z.object({
  customer: z.object({
    email: z.string().email(),
    name: z.string().max(100).optional().nullable(),
    phone: z.string().max(40).optional().nullable(),
    acceptsMarketing: z.boolean().default(false),
  }),
  items: z.array(checkoutItemSchema).min(1, "Cart is empty"),
  shippingAddress: checkoutAddressSchema,
  billingAddress: checkoutAddressSchema.optional(),
  couponCode: z.string().optional().nullable(),
  shippingAmount: z.number().int().nonnegative().default(0),
  notes: z.string().max(500).optional().nullable(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
