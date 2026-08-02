// ---------------------------------------------------------------------------
// Contractor and agent/professional billing-summary adapters. Same normalized
// output shape (ProfessionalBillingSummary), completely separate persistence
// — contractorStore and agentProfileStore are never merged, and a contractor
// row never gains a tier/subscription concept it doesn't have.
// ---------------------------------------------------------------------------

import { contractorStore } from "../store.ts";
import { agentProfileStore } from "../agent-profiles/store.ts";
import { agentSubscriptions, agentInvoices } from "../agent-profiles/billing.ts";
import { resolveAgentTier, diffTierModules } from "../agent-profiles/tiers.ts";
import { normalizeProfilePaymentStatus, derivePaymentStatusFromBilling } from "./normalize.ts";
import type { IntakeOwnerType } from "../professional-intake/types.ts";
import type { ProfessionalBillingSummary } from "./types.ts";

async function contractorBillingSummary(ownerId: string): Promise<ProfessionalBillingSummary | null> {
  const contractor = await contractorStore.getById(ownerId);
  if (!contractor) return null;
  const manual = normalizeProfilePaymentStatus(contractor.manualPaymentStatus);
  return {
    ownerType: "contractor",
    ownerId,
    // Contractors have no tier/plan product today (see 00-current-state-audit.md) — never invented here.
    plan: null,
    paymentStatus: manual ?? "not_required",
    isManualOverride: manual !== null,
    manualNote: contractor.manualPaymentNote,
    manualSetAt: contractor.manualPaymentSetAt,
    manualSetBy: contractor.manualPaymentSetBy,
    planActive: true,
    entitlementValid: true,
    entitlementModulesAdded: [],
    entitlementModulesRemoved: [],
  };
}

async function agentBillingSummary(ownerId: string): Promise<ProfessionalBillingSummary | null> {
  const agent = await agentProfileStore.getById(ownerId);
  if (!agent) return null;

  const manual = normalizeProfilePaymentStatus(agent.manualPaymentStatus);
  const tier = resolveAgentTier(agent.tier ?? null);
  // False only when a stored tier string fails to resolve at all (e.g. corrupted data) — not a "past due" concept.
  const planActive = !agent.tier || tier !== null;

  let paymentStatus = manual;
  let amountDueCents: number | undefined;
  let currency: string | undefined;
  let lastPaymentAt: string | undefined;
  let nextBillingAt: string | undefined;

  if (paymentStatus === null) {
    if (!tier) {
      paymentStatus = "not_required";
    } else {
      const subscriptions = await agentSubscriptions(ownerId);
      const activeSub = subscriptions.find((s) => s.status === "active") ?? subscriptions[0];
      const invoices = activeSub ? await agentInvoices(ownerId, activeSub.id) : [];
      const latestInvoice = invoices[0];
      paymentStatus = derivePaymentStatusFromBilling({
        hasTier: true,
        subscriptionStatus: activeSub ? (activeSub.status === "active" ? "active" : "canceled") : undefined,
        latestInvoiceStatus: latestInvoice ? (latestInvoice.status === "paid" ? "paid" : "open") : undefined,
        latestInvoiceDueAt: latestInvoice?.dueAt ?? undefined,
      });
      amountDueCents = latestInvoice?.amountDueCents;
      currency = latestInvoice?.currency;
      lastPaymentAt = latestInvoice?.paidAt ?? undefined;
      nextBillingAt = activeSub?.currentPeriodEnd ?? undefined;
    }
  }

  const diff = tier ? diffTierModules(agent.modules, tier) : { added: [], removed: [], unchanged: [] };
  const entitlementValid = diff.added.length === 0 && diff.removed.length === 0;

  return {
    ownerType: "agent",
    ownerId,
    plan: tier,
    paymentStatus,
    isManualOverride: manual !== null,
    manualNote: agent.manualPaymentNote,
    manualSetAt: agent.manualPaymentSetAt,
    manualSetBy: agent.manualPaymentSetBy,
    amountDueCents,
    currency,
    lastPaymentAt,
    nextBillingAt,
    planActive,
    entitlementValid,
    entitlementModulesAdded: diff.added,
    entitlementModulesRemoved: diff.removed,
  };
}

export async function getProfessionalBillingSummary(input: {
  ownerType: IntakeOwnerType;
  ownerId: string;
}): Promise<ProfessionalBillingSummary | null> {
  return input.ownerType === "contractor" ? contractorBillingSummary(input.ownerId) : agentBillingSummary(input.ownerId);
}
