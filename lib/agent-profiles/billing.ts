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
import type { AgentModuleKey, AgentProfileTier } from "./types";
import { computeTierModules, diffTierModules, emptyAgentModules, resolveAgentTier } from "./tiers";

export interface TierAssignmentResult {
  tier: AgentProfileTier | null;
  previousTier: AgentProfileTier | null;
  modulesAdded: AgentModuleKey[];
  modulesRemoved: AgentModuleKey[];
}

/**
 * Resolves + diffs a requested tier against the profile's current modules,
 * without writing anything — shared by applyAgentTier and
 * subscribeAgentToTier so each performs exactly one agentProfileStore.update
 * call (as atomic as this store layer supports; see the implementation doc's
 * "Existing customer compatibility" section for why two sequential writes
 * were avoided).
 */
async function prepareTierAssignment(agentProfileId: string, requestedTier: string | null | undefined) {
  const profile = await agentProfileStore.getById(agentProfileId);
  if (!profile) throw new Error("Agent profile not found");
  const previousTier = resolveAgentTier(profile.tier ?? null);

  if (!requestedTier) {
    const { added, removed } = diffTierModules(profile.modules, null);
    return { tier: null as AgentProfileTier | null, previousTier, modules: emptyAgentModules(), modulesAdded: added, modulesRemoved: removed };
  }

  const tier = resolveAgentTier(requestedTier);
  if (!tier) throw new Error(`Unknown SnapLink tier: "${requestedTier}"`);
  const { added, removed } = diffTierModules(profile.modules, tier);
  return { tier, previousTier, modules: computeTierModules(tier), modulesAdded: added, modulesRemoved: removed };
}

/**
 * Applies a tier (canonical or legacy-aliased) to an agent profile and
 * resets that profile's module entitlements to exactly the tier's bundle —
 * tier-authoritative (Option A: a tier change is the single source of truth
 * for tier-managed modules; manual toggles made via "Manage Modules" survive
 * until the next tier change, then reset to the new bundle). Passing a
 * falsy tier clears tier assignment entirely (all modules off) — this does
 * not delete any underlying feature data (Flipbooks, campaigns, invoices),
 * only the access flags. Does not touch billing/subscription state —
 * subscribeAgentToTier() below calls this so both stay in sync from one
 * entry point, without forcing every tier change through a new subscription.
 */
export async function applyAgentTier(agentProfileId: string, requestedTier: string | null | undefined): Promise<TierAssignmentResult> {
  const prep = await prepareTierAssignment(agentProfileId, requestedTier);
  await agentProfileStore.update(agentProfileId, {
    // `null` (not `undefined`) is required to actually clear the column —
    // the store's update() treats `undefined` as "leave this field alone."
    // AgentProfile models tier as optional-only, so this is a narrow cast
    // for the "no tier" path rather than widening that type everywhere.
    tier: (prep.tier ?? null) as AgentProfileTier | undefined,
    modules: prep.modules,
  });
  return { tier: prep.tier, previousTier: prep.previousTier, modulesAdded: prep.modulesAdded, modulesRemoved: prep.modulesRemoved };
}

// Seeded once by scripts/seed-agent-profiles-system.mjs (idempotent, never auto-run).
// realEstateBillingSubscriptions.createdByMembershipId has a real FK to
// realEstateMemberships.id, so this must reference an actual seeded row.
export const SYSTEM_MEMBERSHIP_ID = process.env.AGENT_PROFILES_SYSTEM_MEMBERSHIP_ID || "re_membership_agent_profiles_system";

export function billingScopeFor(agentProfileId: string) {
  const id = `apx_${agentProfileId}`;
  return { tenantId: id, organizationId: id };
}

/**
 * Creates/records a subscription (unmodified real-estate billing engine),
 * then applies the tier's module bundle in the SAME update call as the
 * billing IDs — this is the fix for the core gap: assigning a tier here now
 * mechanically applies its modules instead of requiring a separate manual
 * "Manage Modules" step. `tier` accepts a canonical or legacy string; an
 * unrecognized value throws before any subscription is created.
 */
export async function subscribeAgentToTier(agentProfileId: string, planId: string, tier: string) {
  const prep = await prepareTierAssignment(agentProfileId, tier);
  if (!prep.tier) throw new Error("A tier is required to subscribe");
  const scope = billingScopeFor(agentProfileId);
  const subscription = await subscribeTenant(scope, SYSTEM_MEMBERSHIP_ID, { planId });
  await agentProfileStore.update(agentProfileId, {
    tier: prep.tier,
    modules: prep.modules,
    billingTenantId: scope.tenantId,
    billingOrganizationId: scope.organizationId,
    billingSubscriptionId: subscription.id,
  });
  const tierResult: TierAssignmentResult = {
    tier: prep.tier,
    previousTier: prep.previousTier,
    modulesAdded: prep.modulesAdded,
    modulesRemoved: prep.modulesRemoved,
  };
  return { subscription, tierResult };
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
