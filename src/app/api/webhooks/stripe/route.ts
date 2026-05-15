import { NextResponse } from "next/server";
import { stripeProvider } from "@/server/payments/stripe";
import { dispatchPaymentEvent } from "@/server/payments/dispatcher";

export async function POST(req: Request) {
  if (!stripeProvider.isConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  }
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  const event = await stripeProvider.parseWebhook(body, sig);
  if (!event) return NextResponse.json({ error: "Invalid or unhandled event" }, { status: 400 });

  const result = await dispatchPaymentEvent(event);
  return NextResponse.json({ received: true, ...result });
}
