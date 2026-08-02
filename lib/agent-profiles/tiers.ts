// ---------------------------------------------------------------------------
// Canonical SnapLink tiers and the tier → module bundle mapping. Single
// source of truth, imported by both server code (billing.ts, API routes) and
// client components (AgentForm, AgentProfilesPanel) — deliberately has no
// server-only imports so it stays safe for "use client" files.
//
// See docs/product-packaging/01-snaplink-tiers.md for the product rationale
// and docs/commercial-architecture/10-tier-entitlement-implementation.md for
// the engineering decisions (legacy aliases, tier-authoritative override
// model, why no migration was needed).
// ---------------------------------------------------------------------------
import { AGENT_MODULE_KEYS, type AgentModuleKey, type AgentModules, type AgentProfileTier } from "./types.ts";

export const CANONICAL_AGENT_TIERS: AgentProfileTier[] = ["solo", "professional", "business", "growth", "enterprise"];

export const AGENT_TIER_LABELS: Record<AgentProfileTier, string> = {
  solo: "Solo",
  professional: "Professional",
  business: "Business",
  growth: "Growth",
  enterprise: "Enterprise",
};

// Tiers renamed since the original ship. A stored/submitted legacy value is
// NEVER auto-rewritten in the database by this map — it only resolves a
// legacy string to its canonical equivalent for *interpretation* (bundle
// lookup, display label). The stored value changes only when an operator
// explicitly re-assigns a tier through applyAgentTier/subscribeAgentToTier.
export const LEGACY_TIER_ALIASES: Record<string, AgentProfileTier> = {
  basic: "solo",
  featured: "growth",
};

/** Resolves any stored/submitted tier string (canonical or legacy) to a canonical tier, or null if empty/unrecognized. */
export function resolveAgentTier(raw: string | null | undefined): AgentProfileTier | null {
  if (!raw) return null;
  if ((CANONICAL_AGENT_TIERS as string[]).includes(raw)) return raw as AgentProfileTier;
  return LEGACY_TIER_ALIASES[raw] ?? null;
}

// Grounded in AGENT_MODULE_KEYS (the real, existing module registry) — no
// invented module names. Growth intentionally does not yet include every
// key; Enterprise is defined as "all currently supported agent-side
// modules," so it is deliberately the full AGENT_MODULE_KEYS set rather than
// an independently maintained list that could drift from it.
export const TIER_MODULE_BUNDLES: Record<AgentProfileTier, AgentModuleKey[]> = {
  solo: ["qr", "analytics"],
  professional: ["qr", "analytics", "leads", "booking"],
  business: ["qr", "analytics", "leads", "booking", "flipbooks", "campaigns"],
  growth: ["qr", "analytics", "leads", "booking", "flipbooks", "campaigns", "invoices", "money"],
  enterprise: [...AGENT_MODULE_KEYS],
};

/**
 * Deterministic, full reset: every AGENT_MODULE_KEYS entry is set true/false
 * per the tier's bundle. This is the "tier-authoritative" override model
 * (Option A) — a tier change resets ALL tier-managed modules to exactly the
 * new bundle, not just adding what's missing. See the implementation doc for
 * why this was chosen over preserving arbitrary manual overrides.
 */
export function computeTierModules(tier: AgentProfileTier): AgentModules {
  const bundle = new Set<AgentModuleKey>(TIER_MODULE_BUNDLES[tier]);
  const modules = {} as AgentModules;
  for (const key of AGENT_MODULE_KEYS) modules[key] = bundle.has(key);
  return modules;
}

/** All modules off — the "no tier" state. Never used to delete underlying feature data, only access flags. */
export function emptyAgentModules(): AgentModules {
  const modules = {} as AgentModules;
  for (const key of AGENT_MODULE_KEYS) modules[key] = false;
  return modules;
}

export interface TierModuleDiff {
  added: AgentModuleKey[];
  removed: AgentModuleKey[];
  unchanged: AgentModuleKey[];
}

/** What changes if `tier`'s bundle (or no-tier, when `tier` is null) is applied on top of `currentModules`. */
export function diffTierModules(currentModules: AgentModules | undefined, tier: AgentProfileTier | null): TierModuleDiff {
  const next = tier ? computeTierModules(tier) : emptyAgentModules();
  const added: AgentModuleKey[] = [];
  const removed: AgentModuleKey[] = [];
  const unchanged: AgentModuleKey[] = [];
  for (const key of AGENT_MODULE_KEYS) {
    const was = Boolean(currentModules?.[key]);
    const will = Boolean(next[key]);
    if (was === will) unchanged.push(key);
    else if (will) added.push(key);
    else removed.push(key);
  }
  return { added, removed, unchanged };
}
