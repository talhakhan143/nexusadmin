/**
 * PaymentProvider — pluggable interface so we can swap Stripe / PayPal / etc.
 * Implementations live alongside this file. Webhook handlers map provider events
 * back into the canonical PaymentEvent contract.
 */

export type PaymentEventType =
  | "payment.succeeded"
  | "payment.failed"
  | "payment.refunded";

export interface PaymentEvent {
  type: PaymentEventType;
  /** Internal order ID we can resolve. Provider-specific metadata.orderId. */
  orderId?: string;
  /** Provider transaction reference. */
  ref: string;
  amount?: number; // minor units (cents)
  currency?: string;
  /** Raw provider event ID (idempotency). */
  providerEventId: string;
  rawType: string; // original provider event type, e.g. "payment_intent.succeeded"
}

export interface CreateCheckoutInput {
  orderId: string;
  amount: number; // cents
  currency: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  description?: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  ref: string; // provider-side session/intent id
}

export interface PaymentProvider {
  readonly name: "stripe" | "paypal";
  isConfigured(): boolean;
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;
  refund(ref: string, amount: number): Promise<{ ok: boolean; ref?: string; error?: string }>;
  parseWebhook(payload: string, signature: string | null): Promise<PaymentEvent | null>;
}
