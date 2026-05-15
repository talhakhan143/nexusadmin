import { stripeProvider } from "./stripe";
import { paypalProvider } from "./paypal";
import type { PaymentProvider } from "./types";

export const PROVIDERS: Record<string, PaymentProvider> = {
  stripe: stripeProvider,
  paypal: paypalProvider,
};

export function getProvider(name: string): PaymentProvider | null {
  return PROVIDERS[name] ?? null;
}

export type { PaymentProvider, PaymentEvent, PaymentEventType, CheckoutResult } from "./types";
