import Stripe from "stripe";
import type {
  CreateCheckoutInput,
  CheckoutResult,
  PaymentEvent,
  PaymentProvider,
} from "./types";

/**
 * Stripe adapter. Lazily constructs the SDK so the module never throws when
 * the env vars are missing — `isConfigured()` returns false instead.
 */
class StripeProvider implements PaymentProvider {
  readonly name = "stripe" as const;

  private get sdk(): Stripe | null {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    return new Stripe(key);
  }

  isConfigured(): boolean {
    return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET;
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    if (!this.sdk) throw new Error("Stripe not configured");
    const session = await this.sdk.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      customer_email: input.customerEmail,
      metadata: { orderId: input.orderId },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            product_data: { name: input.description ?? `Order ${input.orderId}` },
            unit_amount: input.amount,
          },
        },
      ],
    });
    return { checkoutUrl: session.url ?? "", ref: session.id };
  }

  async refund(ref: string, amount: number) {
    if (!this.sdk) return { ok: false, error: "Stripe not configured" };
    try {
      const refund = await this.sdk.refunds.create({ payment_intent: ref, amount });
      return { ok: true, ref: refund.id };
    } catch (e: any) {
      return { ok: false, error: e.message ?? "Stripe refund failed" };
    }
  }

  async parseWebhook(payload: string, signature: string | null): Promise<PaymentEvent | null> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !secret || !this.sdk) return null;
    let evt: Stripe.Event;
    try {
      evt = this.sdk.webhooks.constructEvent(payload, signature, secret);
    } catch {
      return null;
    }

    const orderId = (evt.data.object as { metadata?: { orderId?: string } }).metadata?.orderId;

    switch (evt.type) {
      case "payment_intent.succeeded": {
        const pi = evt.data.object as Stripe.PaymentIntent;
        return {
          type: "payment.succeeded",
          orderId,
          ref: pi.id,
          amount: pi.amount,
          currency: pi.currency.toUpperCase(),
          providerEventId: evt.id,
          rawType: evt.type,
        };
      }
      case "payment_intent.payment_failed": {
        const pi = evt.data.object as Stripe.PaymentIntent;
        return {
          type: "payment.failed",
          orderId,
          ref: pi.id,
          providerEventId: evt.id,
          rawType: evt.type,
        };
      }
      case "charge.refunded": {
        const ch = evt.data.object as Stripe.Charge;
        return {
          type: "payment.refunded",
          orderId,
          ref: ch.payment_intent as string,
          amount: ch.amount_refunded,
          currency: ch.currency.toUpperCase(),
          providerEventId: evt.id,
          rawType: evt.type,
        };
      }
      default:
        return null;
    }
  }
}

export const stripeProvider = new StripeProvider();
