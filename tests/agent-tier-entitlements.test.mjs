import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  CANONICAL_AGENT_TIERS,
  AGENT_TIER_LABELS,
  LEGACY_TIER_ALIASES,
  TIER_MODULE_BUNDLES,
  resolveAgentTier,
  computeTierModules,
  emptyAgentModules,
  diffTierModules,
} from "../lib/agent-profiles/tiers.ts";
import { AGENT_MODULE_KEYS } from "../lib/agent-profiles/types.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

// --- 1/2/3: canonical tiers, invalid tiers, legacy aliases ------------------

test("all five canonical tiers are valid and resolve to themselves", () => {
  assert.deepEqual(CANONICAL_AGENT_TIERS, ["solo", "professional", "business", "growth", "enterprise"]);
  for (const tier of CANONICAL_AGENT_TIERS) {
    assert.equal(resolveAgentTier(tier), tier);
    assert.ok(AGENT_TIER_LABELS[tier], `missing display label for ${tier}`);
  }
});

test("invalid/unrecognized tiers are rejected", () => {
  assert.equal(resolveAgentTier("nonsense"), null);
  assert.equal(resolveAgentTier(""), null);
  assert.equal(resolveAgentTier(null), null);
  assert.equal(resolveAgentTier(undefined), null);
  assert.equal(resolveAgentTier("Solo"), null, "resolution is case-sensitive, not fuzzy");
});

test("legacy tier values resolve safely to their canonical replacement", () => {
  assert.deepEqual(LEGACY_TIER_ALIASES, { basic: "solo", featured: "growth" });
  assert.equal(resolveAgentTier("basic"), "solo");
  assert.equal(resolveAgentTier("featured"), "growth");
});

// --- 4-10: bundle contents ---------------------------------------------------

test("Solo bundle is public-presence only: qr + analytics, nothing operational", () => {
  assert.deepEqual(TIER_MODULE_BUNDLES.solo, ["qr", "analytics"]);
});

test("Professional bundle adds leads + booking on top of Solo", () => {
  assert.deepEqual(TIER_MODULE_BUNDLES.professional, ["qr", "analytics", "leads", "booking"]);
});

test("Business enables Flipbook (flipbooks) and Mini Campaigns (campaigns)", () => {
  assert.ok(TIER_MODULE_BUNDLES.business.includes("flipbooks"));
  assert.ok(TIER_MODULE_BUNDLES.business.includes("campaigns"));
});

test("Growth includes Invoices eligibility", () => {
  assert.ok(TIER_MODULE_BUNDLES.growth.includes("invoices"));
});

test("Growth includes Money eligibility", () => {
  assert.ok(TIER_MODULE_BUNDLES.growth.includes("money"));
});

test("Enterprise includes every currently supported agent-side module", () => {
  assert.deepEqual(new Set(TIER_MODULE_BUNDLES.enterprise), new Set(AGENT_MODULE_KEYS));
});

test("every tier bundle only references real AGENT_MODULE_KEYS — no invented module names", () => {
  for (const tier of CANONICAL_AGENT_TIERS) {
    for (const key of TIER_MODULE_BUNDLES[tier]) {
      assert.ok(AGENT_MODULE_KEYS.includes(key), `${tier} bundle references unknown module "${key}"`);
    }
  }
});

test("bundles are monotonically non-decreasing in module count from Solo to Enterprise", () => {
  const counts = CANONICAL_AGENT_TIERS.map((t) => TIER_MODULE_BUNDLES[t].length);
  for (let i = 1; i < counts.length; i++) {
    assert.ok(counts[i] >= counts[i - 1], `tier ${CANONICAL_AGENT_TIERS[i]} has fewer modules than ${CANONICAL_AGENT_TIERS[i - 1]}`);
  }
});

// --- 11/12: upgrade/downgrade diffs ------------------------------------------

test("upgrade (Solo -> Business) adds exactly the newly-included modules", () => {
  const soloModules = computeTierModules("solo");
  const diff = diffTierModules(soloModules, "business");
  assert.deepEqual(new Set(diff.added), new Set(["leads", "booking", "flipbooks", "campaigns"]));
  assert.deepEqual(diff.removed, []);
});

test("downgrade (Growth -> Solo) removes tier-managed premium access", () => {
  const growthModules = computeTierModules("growth");
  const diff = diffTierModules(growthModules, "solo");
  assert.deepEqual(new Set(diff.removed), new Set(["leads", "booking", "flipbooks", "campaigns", "invoices", "money"]));
  assert.deepEqual(diff.added, []);
});

test("clearing a tier (null) removes every currently-enabled module and adds nothing", () => {
  const enterpriseModules = computeTierModules("enterprise");
  const diff = diffTierModules(enterpriseModules, null);
  assert.deepEqual(new Set(diff.removed), new Set(AGENT_MODULE_KEYS));
  assert.deepEqual(diff.added, []);
  assert.deepEqual(computeTierModules === undefined ? {} : emptyAgentModules(), Object.fromEntries(AGENT_MODULE_KEYS.map((k) => [k, false])));
});

// --- 14: manual override / determinism ---------------------------------------

test("computeTierModules is deterministic and tier-authoritative: same tier always full-resets every key", () => {
  const first = computeTierModules("professional");
  const second = computeTierModules("professional");
  assert.deepEqual(first, second);
  // Every AGENT_MODULE_KEYS entry is explicitly present (true or false), not just the bundle's own keys.
  for (const key of AGENT_MODULE_KEYS) {
    assert.equal(typeof first[key], "boolean", `${key} must be explicitly true/false, never omitted`);
  }
  // A manually-added module outside the bundle (simulated "current" state) is
  // gone after the next tier application — Option A, tier-authoritative.
  const manuallyAugmented = { ...computeTierModules("solo"), invoices: true };
  const reapplied = computeTierModules("solo");
  assert.equal(reapplied.invoices, false, "re-applying the same tier resets a manually-added module outside its bundle");
  assert.notDeepEqual(manuallyAugmented, reapplied);
});

// --- 22/23: invalid tier cannot be persisted, legacy values remain readable --

test("billing.ts throws before any write when a tier cannot be resolved, and never invents an override system", async () => {
  const billing = await source("../lib/agent-profiles/billing.ts");
  assert.match(billing, /if \(!tier\) throw new Error\(`Unknown SnapLink tier: "\$\{requestedTier\}"`\)/);
  assert.match(billing, /resolveAgentTier/);
  assert.match(billing, /computeTierModules/);
  assert.match(billing, /diffTierModules/);
  // Extends the existing subscription model rather than creating a second one.
  assert.match(billing, /from "@\/lib\/real-estate\/marketplace\/billing"/);
  assert.doesNotMatch(billing, /new.*BillingEngine|ParallelEntitlement|SecondSubscription/i);
});

test("subscribeAgentToTier and applyAgentTier each perform exactly one agentProfileStore.update call (atomic-as-supported)", async () => {
  const billing = await source("../lib/agent-profiles/billing.ts");
  const applyFn = billing.slice(billing.indexOf("export async function applyAgentTier"), billing.indexOf("export const SYSTEM_MEMBERSHIP_ID"));
  const subscribeFn = billing.slice(billing.indexOf("export async function subscribeAgentToTier"));
  assert.equal((applyFn.match(/agentProfileStore\.update\(/g) || []).length, 1);
  assert.equal((subscribeFn.match(/agentProfileStore\.update\(/g) || []).length, 1);
});

// --- 15/16: existing-account compatibility -----------------------------------

test("no startup/background reconciliation exists — tier bundles apply only through explicit assignment", async () => {
  const store = await source("../lib/agent-profiles/store.ts");
  const storeJson = await source("../lib/agent-profiles/store-json.ts");
  const storePg = await source("../lib/agent-profiles/store-pg.ts");
  for (const text of [store, storeJson, storePg]) {
    assert.doesNotMatch(text, /tiers\.ts|computeTierModules|applyAgentTier|subscribeAgentToTier/, "the store layer must stay unaware of tier bundling — only billing.ts/routes apply it explicitly");
  }
});

test("accounts without a tier are left alone — applyAgentTier is never called implicitly on read", async () => {
  const routeGet = await source("../app/api/agent-profiles/[id]/route.ts");
  const getHandler = routeGet.slice(routeGet.indexOf("export async function GET"), routeGet.indexOf("export async function PATCH"));
  assert.doesNotMatch(getHandler, /applyAgentTier|subscribeAgentToTier/);
});

// --- 17: readiness gates ------------------------------------------------------

test("no fabricated readiness gate was introduced for agent modules (none exist yet — see implementation doc)", async () => {
  const billing = await source("../lib/agent-profiles/billing.ts");
  assert.doesNotMatch(billing, /stripeAccountId|stripeOnboardingComplete|chargesEnabled|payoutsEnabled/i);
});

// --- 18: JSON/Postgres parity -------------------------------------------------

test("both agent-profile stores accept a null tier (clears the field) the same way — undefined never overwrites, null does", async () => {
  const storeJson = await source("../lib/agent-profiles/store-json.ts");
  const storePg = await source("../lib/agent-profiles/store-pg.ts");
  assert.match(storeJson, /Object\.assign\(profile, patch/);
  assert.match(storePg, /if \(value !== undefined\) set\[key\] = value/);
});

test("both stores expose the same update(id, patch) signature for tier/modules writes", async () => {
  const storeJson = await source("../lib/agent-profiles/store-json.ts");
  const storePg = await source("../lib/agent-profiles/store-pg.ts");
  const sig = /async update\(id: string, patch: Partial<Omit<AgentProfile, "id" \| "createdAt">>\): Promise<AgentProfile \| undefined>/;
  assert.match(storeJson, sig);
  assert.match(storePg, sig);
});

// --- 19/20/21: operator UI preview + confirmation ----------------------------

test("the Edit Agent form shows a live 'Plan includes' preview and resets modules when the tier changes", async () => {
  const form = await source("../components/agent-profiles/AgentForm.tsx");
  assert.match(form, /Plan includes:/);
  assert.match(form, /computeTierModules\(nextTier\)/);
  assert.match(form, /CANONICAL_AGENT_TIERS/);
  assert.match(form, /AGENT_TIER_LABELS/);
});

test("the Edit Agent page requires confirmation and previews additions/removals before a downgrade is saved", async () => {
  const page = await source("../app/southline/admin/agents/[id]/page.tsx");
  assert.match(page, /diffTierModules\(profile\.modules, newTier\)/);
  assert.match(page, /diff\.removed\.length > 0/);
  assert.match(page, /Modules being added/);
  assert.match(page, /Modules being removed/);
  assert.match(page, /if \(!confirm\(msg\)\) return/);
  assert.match(page, /not deleted data/i);
});

test("AgentProfilesPanel's activation dropdown and plan-name matcher use the canonical five tiers", async () => {
  const panel = await source("../components/southline/admin/AgentProfilesPanel.tsx");
  assert.doesNotMatch(panel, /<option value="basic">Basic<\/option>/);
  assert.match(panel, /CANONICAL_AGENT_TIERS\.map/);
  assert.match(panel, /function tierFromPlanName/);
  assert.match(panel, /if \(lower\.includes\("enterprise"\)\) return "enterprise"/);
});

// --- API routes: server-side validation, no unknown tier persisted ----------

test("PATCH [id] route resolves tier via resolveAgentTier semantics, not the old hardcoded 3-value array", async () => {
  const route = await source("../app/api/agent-profiles/[id]/route.ts");
  assert.doesNotMatch(route, /\["basic", "professional", "featured"\]/);
  assert.match(route, /applyAgentTier/);
  assert.match(route, /subscribeAgentToTier/);
  assert.match(route, /tierResult/);
});

test("billing route and create route no longer hardcode the legacy 3-tier allowlist", async () => {
  const billingRoute = await source("../app/api/agent-profiles/[id]/billing/route.ts");
  const createRoute = await source("../app/api/agent-profiles/create/route.ts");
  assert.doesNotMatch(billingRoute, /\["basic", "professional", "featured"\]/);
  assert.doesNotMatch(createRoute, /\["basic", "professional", "featured"\]/);
  assert.match(billingRoute, /resolveAgentTier/);
  assert.match(createRoute, /resolveAgentTier/);
  assert.match(createRoute, /computeTierModules/);
});

// --- Migration decision -------------------------------------------------------

test("no migration was created for the tier change — schema.ts still stores tier as plain nullable text", async () => {
  const schema = await source("../lib/db/schema.ts");
  assert.match(schema, /tier:text\("tier"\)/);
  assert.doesNotMatch(schema, /tier:text\("tier"\)\.notNull\(\)/);
});

// --- Architecture boundaries: contractor entitlements / rentals untouched ---

test("this pass does not touch the contractor ModuleKey/entitlements system or Rentals & Getaways", async () => {
  const tiers = await source("../lib/agent-profiles/tiers.ts");
  assert.doesNotMatch(tiers, /from ["']@\/lib\/entitlement-types["']|from ["']@\/lib\/entitlements["']/);
  assert.doesNotMatch(tiers, /rentals|getaway/i);
});
