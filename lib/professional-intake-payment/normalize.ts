// ---------------------------------------------------------------------------
// Payment status normalization. One place raw values become the canonical
// ProfilePaymentStatus enum — nothing downstream ever branches on a raw
// Stripe/subscription/invoice string directly.
// ---------------------------------------------------------------------------

import { PROFILE_PAYMENT_STATUSES, type ProfilePaymentStatus } from "./types.ts";

const VALID = new Set<string>(PROFILE_PAYMENT_STATUSES);

/**
 * Coerces a raw stored value (e.g. the manual override column) into the
 * canonical enum. An unrecognized value is never guessed into something
 * permissive — it resolves to null, and callers must treat "no recognized
 * status" as blocking, not as automatically satisfied.
 */
export function normalizeProfilePaymentStatus(raw: unknown): ProfilePaymentStatus | null {
  if (typeof raw !== "string") return null;
  return VALID.has(raw) ? (raw as ProfilePaymentStatus) : null;
}

export interface BillingSignal {
  hasTier: boolean;
  subscriptionStatus?: "active" | "canceled";
  latestInvoiceStatus?: "open" | "paid";
  latestInvoiceDueAt?: string;
}

/**
 * Derives a canonical payment status purely from the real, reused billing
 * engine's own signals (lib/real-estate/marketplace/billing.ts, via
 * lib/agent-profiles/billing.ts) — never used when a manual override exists,
 * since the override always takes precedence (see adapters.ts).
 *
 * The underlying engine only models "active"/"canceled" subscriptions and
 * "open"/"paid" invoices — it has no "failed"/"refunded" concept, so those
 * two canonical statuses are only ever reachable via a manual override, not
 * derived here. That is a real, honest limitation of the reused engine, not
 * a gap in this normalizer.
 */
export function derivePaymentStatusFromBilling(signal: BillingSignal): ProfilePaymentStatus {
  if (!signal.hasTier) return "not_required";
  if (!signal.subscriptionStatus || signal.subscriptionStatus === "canceled") return "payment_required";
  if (signal.latestInvoiceStatus === "paid") return "paid";
  if (signal.latestInvoiceStatus === "open") {
    if (signal.latestInvoiceDueAt && new Date(signal.latestInvoiceDueAt).getTime() < Date.now()) return "past_due";
    return "pending";
  }
  // Active subscription, no invoice generated yet.
  return "pending";
}
