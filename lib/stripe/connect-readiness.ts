import type Stripe from "stripe";
import type { Contractor, StripeConnectStatus } from "@/lib/types";

export type StripeReadinessPatch = Partial<Contractor> & { stripeConnectStatus: StripeConnectStatus };

export function deriveStripeConnectStatus(input: {
  connected: boolean; detailsSubmitted: boolean; chargesEnabled: boolean; payoutsEnabled: boolean;
  requirementsCurrentlyDue?: string[]; disabledReason?: string | null;
}): StripeConnectStatus {
  if (!input.connected) return "not_connected";
  if (input.detailsSubmitted && input.chargesEnabled && input.payoutsEnabled) return "ready";
  if (!input.detailsSubmitted) return "incomplete";
  if (input.disabledReason || input.requirementsCurrentlyDue?.length || !input.chargesEnabled || !input.payoutsEnabled) return "restricted";
  return "incomplete";
}

export function readinessPatchFromAccount(account: Stripe.Account, now = new Date()): StripeReadinessPatch {
  const requirementsCurrentlyDue = account.requirements?.currently_due ?? [];
  const stripeConnectStatus = deriveStripeConnectStatus({ connected: true, detailsSubmitted: Boolean(account.details_submitted), chargesEnabled: Boolean(account.charges_enabled), payoutsEnabled: Boolean(account.payouts_enabled), requirementsCurrentlyDue, disabledReason: account.requirements?.disabled_reason ?? null });
  return {
    stripeDetailsSubmitted: Boolean(account.details_submitted),
    stripeChargesEnabled: Boolean(account.charges_enabled),
    stripePayoutsEnabled: Boolean(account.payouts_enabled),
    stripeRequirementsCurrentlyDue: requirementsCurrentlyDue,
    stripeDisabledReason: account.requirements?.disabled_reason ?? undefined,
    stripeLastSyncedAt: now.toISOString(),
    stripeConnectStatus,
    stripeOnboardingComplete: stripeConnectStatus === "ready",
  };
}
