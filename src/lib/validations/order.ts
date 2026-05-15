import { z } from "zod";

export const orderStatusEnum = z.enum([
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

export const paymentStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

export const orderQuerySchema = z.object({
  q: z.string().optional(),
  status: orderStatusEnum.optional(),
  paymentStatus: paymentStatusEnum.optional(),
  customerId: z.string().optional(),
  from: z.string().optional(), // ISO date
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type OrderQuery = z.infer<typeof orderQuerySchema>;

export const updateStatusSchema = z.object({
  status: orderStatusEnum,
  note: z.string().max(500).optional().nullable(),
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const updateTrackingSchema = z.object({
  trackingNumber: z.string().min(1).max(100),
  trackingUrl: z.string().url().optional().nullable().or(z.literal("")),
});
export type UpdateTrackingInput = z.infer<typeof updateTrackingSchema>;

export const refundSchema = z.object({
  amount: z.number().int().positive("Amount must be > 0"), // cents
  reason: z.string().max(500).optional().nullable(),
});
export type RefundInput = z.infer<typeof refundSchema>;
