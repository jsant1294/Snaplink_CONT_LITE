// ---------------------------------------------------------------------------
// Manual payment/comp overrides. Internal administrative status only — this
// never touches Stripe, the real-estate billing engine, or fabricates a
// payment. Every write stamps who/when (operator identity is a free-text
// label, matching lib/entitlements.ts's enabledBy convention — this repo has
// no per-operator accounts, only a shared OPERATOR_PIN).
// ---------------------------------------------------------------------------

import { contractorStore } from "../store.ts";
import { agentProfileStore } from "../agent-profiles/store.ts";
import { PROFILE_PAYMENT_STATUSES, type ProfilePaymentStatus } from "./types.ts";
import type { IntakeOwnerType } from "../professional-intake/types.ts";

const VALID = new Set<string>(PROFILE_PAYMENT_STATUSES);

export function isValidManualPaymentStatus(value: unknown): value is ProfilePaymentStatus {
  return typeof value === "string" && VALID.has(value);
}

/** `status: null` clears the override, reverting to the derived billing status (agents) or "not_required" (contractors). */
export async function setManualPaymentStatus(
  ownerType: IntakeOwnerType,
  ownerId: string,
  status: ProfilePaymentStatus | null,
  note: string | undefined,
  setBy: string
): Promise<boolean> {
  const store = ownerType === "contractor" ? contractorStore : agentProfileStore;
  const updated = await store.setManualPayment(ownerId, { manualPaymentStatus: status, manualPaymentNote: note, manualPaymentSetBy: setBy });
  return Boolean(updated);
}
