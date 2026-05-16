import { stripeProvider } from "./stripe";
import { paypalProvider } from "./paypal";
import { jazzcashProvider } from "./jazzcash";
import { easypaisaProvider } from "./easypaisa";
import type { PaymentProvider } from "./types";

export const PROVIDERS: Record<string, PaymentProvider> = {
  stripe: stripeProvider,
  paypal: paypalProvider,
  jazzcash: jazzcashProvider,
  easypaisa: easypaisaProvider,
  // CARD currently routes through Stripe (configured via env), keeping the public API simple.
  card: stripeProvider,
};

export function getProvider(name: string): PaymentProvider | null {
  return PROVIDERS[name.toLowerCase()] ?? null;
}

export type { PaymentProvider, PaymentEvent, PaymentEventType, CheckoutResult } from "./types";
