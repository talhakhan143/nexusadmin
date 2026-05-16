import type { PaymentProvider } from "./types";

/**
 * Easypaisa provider stub.
 *
 * Real integration:
 *   1. Sign up at https://easypay.easypaisa.com.pk/ for sandbox / merchant credentials.
 *   2. Set EASYPAISA_STORE_ID, EASYPAISA_HASH_KEY, EASYPAISA_RETURN_URL.
 *   3. Build hashed payload, redirect to Easypaisa hosted checkout page.
 *   4. Easypaisa POSTs the result to your RETURN_URL. Verify hash, dispatch PaymentEvent.
 */
export const easypaisaProvider: PaymentProvider = {
  name: "easypaisa",
  isConfigured() {
    return Boolean(process.env.EASYPAISA_STORE_ID && process.env.EASYPAISA_HASH_KEY);
  },
  async createCheckout(input) {
    const ref = `EP-${Date.now()}-${input.orderId.slice(0, 6)}`;
    const sandbox = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/payments/easypaisa/sandbox?ref=${ref}&order=${input.orderId}&amount=${input.amount}&return=${encodeURIComponent(input.successUrl)}`;
    return { checkoutUrl: sandbox, ref };
  },
  async refund() {
    return { ok: false, error: "Easypaisa refunds require manual processing." };
  },
  async parseWebhook(payload) {
    try {
      const json = JSON.parse(payload);
      if (!json.transactionId) return null;
      const success = json.responseCode === "0000";
      return {
        type: success ? "payment.succeeded" : "payment.failed",
        ref: json.transactionId,
        orderId: json.orderId,
        amount: Number(json.amount) || undefined,
        currency: "PKR",
        providerEventId: json.transactionId,
        rawType: `easypaisa.${json.responseCode}`,
      };
    } catch {
      return null;
    }
  },
};
