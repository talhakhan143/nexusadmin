import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { Badge, type BadgeProps } from "@/components/ui/badge";

const STATUS_VARIANT: Record<OrderStatus, BadgeProps["variant"]> = {
  PENDING: "warning",
  PROCESSING: "secondary",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

const PAYMENT_VARIANT: Record<PaymentStatus, BadgeProps["variant"]> = {
  PENDING: "warning",
  PAID: "success",
  FAILED: "destructive",
  REFUNDED: "destructive",
  PARTIALLY_REFUNDED: "warning",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={PAYMENT_VARIANT[status]}>{status.replace("_", " ")}</Badge>;
}
