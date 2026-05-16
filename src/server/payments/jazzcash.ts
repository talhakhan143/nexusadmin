import type { PaymentProvider } from "./types";

/**
 * JazzCash provider stub.
 *
 * Real integration:
 *   1. Sign up at https://sandbox.jazzcash.com.pk/ for sandbox / merchant credentials.
 *   2. Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, JAZZCASH_INTEGRITY_SALT, JAZZCASH_RETURN_URL.
 *   3. Implement HMAC SHA-256 signing of the request payload (sorted keys, salt-prefixed).
 *   4. Redirect customer to the JazzCash hosted checkout URL, with the signed payload as POST body.
 *   5. JazzCash POSTs back to your RETURN_URL with the result + signature. Verify signature, then
 *      dispatch a `payment.succeeded` / `payment.failed` PaymentEvent via the dispatcher.
 *
 * For now this returns a sandbox-style redirect URL so the UI flow can be tested end-to-end.
 */
export const jazzcashProvider: PaymentProvider = {
  name: "jazzcash",
  isConfigured() {
    return Boolean(
      process.env.JAZZCASH_MERCHANT_ID &&
        process.env.JAZZCASH_PASSWORD &&
        process.env.JAZZCASH_INTEGRITY_SALT
    );
  },
  async createCheckout(input) {
    // Stub: in production, build signed payload + POST to JazzCash hosted page.
    const ref = `JC-${Date.now()}-${input.orderId.slice(0, 6)}`;
    const sandbox = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/payments/jazzcash/sandbox?ref=${ref}&order=${input.orderId}&amount=${input.amount}&return=${encodeURIComponent(input.successUrl)}`;
    return { checkoutUrl: sandbox, ref };
  },
  async refund() {
    return { ok: false, error: "JazzCash refunds require manual processing through merchant portal." };
  },
  async parseWebhook(payload) {
    try {
      const json = JSON.parse(payload);
      if (!json.pp_TxnRefNo) return null;
      // Real integration: verify pp_SecureHash against integrity salt before trusting payload.
      const success = json.pp_ResponseCode === "000";
      return {
        type: success ? "payment.succeeded" : "payment.failed",
        ref: json.pp_TxnRefNo,
        orderId: json.ppmpf_1, // merchant-defined field
        amount: Number(json.pp_Amount) || undefined,
        currency: "PKR",
        providerEventId: json.pp_TxnRefNo,
        rawType: `jazzcash.${json.pp_ResponseCode}`,
      };
    } catch {
      return null;
    }
  },
};
