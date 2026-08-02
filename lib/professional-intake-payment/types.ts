// ---------------------------------------------------------------------------
// Professional Intake — payment status & publication gating.
// Reuses the real-estate marketplace billing engine (subscriptions/invoices,
// via lib/agent-profiles/billing.ts) for agents, and the manual-override
// columns added by this task (lib/db/schema.ts) for everyone. Never a second
// subscription system — see docs/professional-intake-payment/00-*.
// ---------------------------------------------------------------------------

import type { IntakeOwnerType } from "../professional-intake/types.ts";

export type ProfilePaymentStatus =
  | "not_required"
  | "payment_required"
  | "pending"
  | "paid"
  | "past_due"
  | "failed"
  | "refunded"
  | "comped";

export const PROFILE_PAYMENT_STATUSES: ProfilePaymentStatus[] = [
  "not_required",
  "payment_required",
  "pending",
  "paid",
  "past_due",
  "failed",
  "refunded",
  "comped",
];

/** Statuses that satisfy "this profile is allowed to go live," payment-wise. */
export const PAYMENT_SATISFIED_STATUSES: ProfilePaymentStatus[] = ["not_required", "paid", "comped"];

export interface PublicationEligibility {
  profileApproved: boolean;
  paymentRequired: boolean;
  paymentSatisfied: boolean;
  planActive: boolean;
  entitlementValid: boolean;
  canPublish: boolean;
  reasons: string[];
}

export interface ProfessionalBillingSummary {
  ownerType: IntakeOwnerType;
  ownerId: string;
  /** Canonical tier, agents only. Always undefined for contractors (no tier system exists for them). */
  plan: string | null;
  paymentStatus: ProfilePaymentStatus;
  /** True when the status above came from an operator override rather than a derived billing record. */
  isManualOverride: boolean;
  manualNote?: string;
  manualSetAt?: string;
  manualSetBy?: string;
  amountDueCents?: number;
  currency?: string;
  billingInterval?: string;
  lastPaymentAt?: string;
  nextBillingAt?: string;
  planActive: boolean;
  entitlementValid: boolean;
  entitlementModulesAdded: string[];
  entitlementModulesRemoved: string[];
}
