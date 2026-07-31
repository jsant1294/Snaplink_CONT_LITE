// ---------------------------------------------------------------------------
// Billing for Snaplink Profile tiers, reusing lib/real-estate/marketplace/
// billing.ts UNMODIFIED via a synthetic per-profile tenant/organization scope.
// Each agent profile is treated as its own "tenant of one" purely so the
// existing plan/subscription/invoice functions work without any change to
// that module (see docs/REAL_ESTATE_PHASE_11_OAUTH_BILLING.md for why that
// module must stay untouched — tests/real-estate-phase11.test.mjs enforces it).
//
// No price is invented here. Plans (Basic/Professional/Featured) are created
// by an operator via the existing POST /api/real-estate/billing/plans route
// with real amounts they supply — this module only looks plans up by id.
// ---------------------------------------------------------------------------
import "server-only";
import { cancelSubscription, generateInvoice, listInvoices, listSubscriptions, subscribeTenant } from "@/lib/real-estate/marketplace/billing";
import { agentProfileStore } from "./store";
import type { AgentProfileTier } from "./types";

// Seeded once by scripts/seed-agent-profiles-system.mjs (idempotent, never auto-run).
// realEstateBillingSubscriptions.createdByMembershipId has a real FK to
// realEstateMemberships.id, so this must reference an actual seeded row.
export const SYSTEM_MEMBERSHIP_ID = process.env.AGENT_PROFILES_SYSTEM_MEMBERSHIP_ID || "re_membership_agent_profiles_system";

export function billingScopeFor(agentProfileId: string) {
  const id = `apx_${agentProfileId}`;
  return { tenantId: id, organizationId: id };
}

export async function subscribeAgentToTier(agentProfileId: string, planId: string, tier: AgentProfileTier) {
  const scope = billingScopeFor(agentProfileId);
  const subscription = await subscribeTenant(scope, SYSTEM_MEMBERSHIP_ID, { planId });
  await agentProfileStore.update(agentProfileId, {
    tier,
    billingTenantId: scope.tenantId,
    billingOrganizationId: scope.organizationId,
    billingSubscriptionId: subscription.id,
  });
  return subscription;
}

export async function cancelAgentSubscription(agentProfileId: string, subscriptionId: string) {
  return cancelSubscription(billingScopeFor(agentProfileId), SYSTEM_MEMBERSHIP_ID, subscriptionId);
}

export async function agentSubscriptions(agentProfileId: string) {
  return listSubscriptions(billingScopeFor(agentProfileId));
}

export async function agentInvoices(agentProfileId: string, subscriptionId?: string) {
  return listInvoices({ tenantId: billingScopeFor(agentProfileId).tenantId }, subscriptionId);
}

export async function generateAgentInvoice(agentProfileId: string, subscriptionId: string) {
  return generateInvoice({ tenantId: billingScopeFor(agentProfileId).tenantId }, subscriptionId);
}
