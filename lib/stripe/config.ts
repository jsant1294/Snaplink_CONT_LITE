// ---------------------------------------------------------------------------
// Stripe Connect (contractor invoicing) — disabled by default. Mirrors
// lib/lucio/config.ts's pattern: reads env directly, fails closed, never
// throws just because a key is missing.
//
// Invoices also require a real Postgres backend (webhook idempotency needs a
// real database) — JSON-file/local-demo mode never enables this feature,
// even with a Stripe key set.
// ---------------------------------------------------------------------------

import { usePg } from "@/lib/db-url";

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim()) && usePg;
}

let _stripe: import("stripe").default | null = null;

/** Throws if called while Stripe is disabled — callers must check stripeEnabled() first. */
export async function getStripe(): Promise<import("stripe").default> {
  if (!stripeEnabled()) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY unset or no Postgres backend)");
  }
  if (!_stripe) {
    const { default: Stripe } = await import("stripe");
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim());
  }
  return _stripe;
}

export function stripeWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
}

export function stripeConnectClientId(): string {
  return process.env.STRIPE_CONNECT_CLIENT_ID?.trim() ?? "";
}
