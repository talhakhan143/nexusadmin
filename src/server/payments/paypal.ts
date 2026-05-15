import type { PaymentProvider, CreateCheckoutInput } from "./types";

/**
 * PayPal stub. Real implementation will hit the PayPal Orders v2 API.
 * Kept here so the rest of the app can already reference the provider name.
 */
class PayPalProvider implements PaymentProvider {
  readonly name = "paypal" as const;

  isConfigured(): boolean {
    return !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET;
  }

  async createCheckout(_input: CreateCheckoutInput) {
    throw new Error("PayPal adapter not implemented yet — wire in PayPal Orders v2 API.");
  }

  async refund(_ref: string, _amount: number) {
    return { ok: false, error: "PayPal adapter not implemented" };
  }

  async parseWebhook(_payload: string, _signature: string | null) {
    return null;
  }
}

export const paypalProvider = new PayPalProvider();
