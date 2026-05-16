"use server";

import { createOrder, getOrder } from "@/lib/api-client";
import type { ApiCheckoutPayload, ApiCheckoutResponse, ApiOrderDetail } from "@/types/api";
import { ApiError } from "@/lib/api-client";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function placeOrderAction(
  payload: ApiCheckoutPayload
): Promise<ActionResult<ApiCheckoutResponse>> {
  try {
    const data = await createOrder(payload);
    return { ok: true, data };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: (e as Error).message };
  }
}

export async function fetchOrderAction(
  orderNumber: string,
  email: string
): Promise<ActionResult<ApiOrderDetail>> {
  try {
    const data = await getOrder(orderNumber, email);
    return { ok: true, data };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return { ok: false, error: "Order not found. Check the number and email." };
    }
    return { ok: false, error: (e as Error).message };
  }
}
