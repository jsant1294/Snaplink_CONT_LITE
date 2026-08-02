# SnapLink Tier-to-Entitlement Automation

Scope: agent/adjacent-professional SnapLink tier system and entitlement automation only.
Payment processing, contractor entitlements, Rentals & Getaways billing, and Southline
marketplace billing were explicitly out of scope and untouched — see "Architecture boundaries"
below for what was verified unmodified.

## Objective

Before this change, assigning a tier to an agent profile (`AgentProfileTier`) and enabling that
profile's feature modules (`AgentModuleKey` — `booking`, `leads`, `campaigns`, `flipbooks`,
`invoices`, `money`, `analytics`, `qr`, `nfc`) were two completely independent write paths.
`subscribeAgentToTier()` set the tier and billing IDs; an operator had to separately, manually,
toggle each module in a checkbox grid. Nothing connected "this profile is on the Business plan"
to "this profile actually has Flipbook and Mini Campaigns enabled." This work connects them.

## Phase 1 — What was verified before any code changed

- **`AgentProfileTier`**: was `"basic" | "professional" | "featured"`
  (`lib/agent-profiles/types.ts`).
- **Database storage**: `tier: text("tier")` on `agent_profiles` — **plain nullable text, no
  enum, no check constraint** (`lib/db/schema.ts`, confirmed against
  `drizzle/0012_agent_profiles.sql`, which only adds `"tier" text` with no constraint clause).
- **Module storage**: `modules: jsonb("modules").$type<Record<string, boolean>>()` directly on
  `agent_profiles` — a real, separate, already-existing registry (`AgentModuleKey`,
  `AGENT_MODULE_KEYS`), deliberately independent of the contractor `ModuleKey`/
  `professional_module_entitlements` system (confirmed by an existing test:
  `tests/agent-management.test.mjs` "the agent modules system stays separate from the contractor
  ModuleKey/entitlements system").
- **`subscribeAgentToTier()`** (`lib/agent-profiles/billing.ts`): called
  `subscribeTenant()` (the real-estate marketplace billing engine, reused via a synthetic
  per-profile tenant scope) and wrote `tier` + billing IDs — never touched `modules`.
- **Operator tier controls**: two places — `AgentProfilesPanel.tsx`'s pending-request activation
  flow (tier + plan selected together, calls the PATCH route with both), and `AgentForm.tsx`'s
  "Tier" `<select>` on the Edit Agent page (`/southline/admin/agents/[id]`).
- **A real, pre-existing bug found during verification**: the Edit page's Tier select did
  nothing on save. `buildPayload()` sends `{ tier, ... }` with no `planId`, but the PATCH route
  only applied a tier change when **both** `body.tier` and `body.planId` were present. Changing
  tier without also picking a billing plan silently no-op'd. Fixing the automation fixes this too
  — `applyAgentTier()` (below) handles the tier-only case.
- **Existing tests to keep green**: `tests/agent-management.test.mjs`,
  `tests/unified-professional-profile.test.mjs`, `tests/schema-drift.test.mjs` — all still
  65/65 passing (run together with the new suite) after this change.

## Migration decision: none

Per the stated rule ("only create a migration if the database genuinely constrains the allowed
values"): `tier` is plain `text` with no constraint. **No migration was created.** The change
from three tier values to five is purely an application-layer TypeScript type change
(`lib/agent-profiles/types.ts`) plus new interpretation logic (`lib/agent-profiles/tiers.ts`).

## Canonical tiers and legacy aliases

```ts
export type AgentProfileTier = "solo" | "professional" | "business" | "growth" | "enterprise";

export const LEGACY_TIER_ALIASES: Record<string, AgentProfileTier> = {
  basic: "solo",
  featured: "growth",
};
```

`resolveAgentTier(raw)` (`lib/agent-profiles/tiers.ts`) resolves either form to canonical, or
returns `null` for anything unrecognized (including empty/absent). **Legacy stored values are
never rewritten automatically** — a profile with `tier: "basic"` in the database stays exactly
that in storage. `resolveAgentTier` only affects *interpretation*: which bundle applies, which
label displays. The stored value only changes to the canonical form when an operator explicitly
touches that profile's tier again (re-saving the Edit form, even unchanged, naturally upgrades
it — an explicit action, not a background rewrite).

`"professional"` needed no alias — the name was already identical between the old and new sets.

## Canonical module bundles

Built from the real, existing `AGENT_MODULE_KEYS` registry — no invented module names.

```ts
export const TIER_MODULE_BUNDLES: Record<AgentProfileTier, AgentModuleKey[]> = {
  solo:         ["qr", "analytics"],
  professional: ["qr", "analytics", "leads", "booking"],
  business:     ["qr", "analytics", "leads", "booking", "flipbooks", "campaigns"],
  growth:       ["qr", "analytics", "leads", "booking", "flipbooks", "campaigns", "invoices", "money"],
  enterprise:   [...AGENT_MODULE_KEYS], // every currently supported module — literally derived, not a maintained duplicate list
};
```

Enterprise is defined as `[...AGENT_MODULE_KEYS]` rather than an independently written 9-item
list specifically so it can never drift from the real registry if a module is ever added or
renamed — a test enforces this (`Enterprise includes every currently supported agent-side
module`, asserting set-equality against `AGENT_MODULE_KEYS` directly).

## Readiness gates: none exist, so none were faked

The brief's model — "tier grants eligibility AND readiness checks grant operation" — was
preserved as designed, but verification found **no existing readiness-gate infrastructure for
agent modules** (no `stripeAccountId`/`stripeOnboardingComplete`-equivalent columns on
`agent_profiles`, unlike the contractor side). Building fake readiness gates, or a real Stripe
Connect check, would itself be payment-processing-adjacent work, explicitly out of scope. Result:
tier currently grants eligibility outright — there is nothing to gate against yet. A test
(`no fabricated readiness gate was introduced for agent modules`) guards against this being
silently "fixed" with an invented check later without updating this document.

## Manual overrides: Option A (tier-authoritative), chosen and documented

No existing mechanism distinguishes "this module is on because the tier includes it" from "this
module is on because an operator manually flipped it" — `modules` is a single flat map. Building
that distinction (Option B, "manual additions preserved") would require a genuinely new field to
track origin — not something this scope should introduce for a first pass.

**Chosen model: Option A.** `computeTierModules(tier)` performs a full, deterministic reset of
*every* `AGENT_MODULE_KEYS` entry to exactly the new tier's bundle — not just adding what's
missing. Concretely:

- Changing a profile's tier resets **all** its modules to that tier's bundle, discarding any
  manual toggle made since the last tier change.
- Manual toggles made through "Manage Modules" (either quick panel) persist normally and are not
  touched by anything *except* the next tier change.
- This is stated directly in the operator UI in two places: the Edit Agent form's "Enabled
  modules" heading ("manual override; the next tier change resets this to that tier's plan") and
  the "Manage Modules" quick-action panel in `AgentProfilesPanel`.

## Subscription behavior

Two entry points, both funneling through one shared, non-writing helper
(`prepareTierAssignment`) so each performs exactly one `agentProfileStore.update()` call:

- **`applyAgentTier(agentProfileId, requestedTier)`** — resolves the tier, computes the diff and
  new bundle, writes `{ tier, modules }` in one call. Does not touch billing state. Passing a
  falsy tier clears the tier entirely (all modules off) — `null` is passed to the store
  explicitly (not `undefined`, which the store's `update()` treats as "leave this field alone");
  this is the one place in the codebase where clearing `tier` is meaningfully supported.
- **`subscribeAgentToTier(agentProfileId, planId, tier)`** — creates/records the subscription via
  the unmodified real-estate billing engine, then writes `{ tier, modules, billingTenantId,
  billingOrganizationId, billingSubscriptionId }` in one call. This is the fix for the core
  gap: assigning a tier through the paid-activation flow now mechanically applies its modules
  instead of requiring a separate manual step.

Both return a `TierAssignmentResult` (`{ tier, previousTier, modulesAdded, modulesRemoved }`) so
callers (API routes, and eventually richer UI) can show exactly what changed.

**On atomicity**: "perform updates atomically where possible" — this store layer has no
cross-call transaction primitive (the JSON store re-reads/re-writes a whole file per call; the
Postgres store issues one `UPDATE` per call, with no `BEGIN`/`COMMIT` wrapping across multiple
calls). The practical ceiling for "atomic" here is *one write call containing every field that
needs to change together*, which is what both functions do — tier, modules, and (for
`subscribeAgentToTier`) billing IDs are never split across two separate `update()` calls. True
cross-call transactional atomicity is not available without deeper store changes, which is out
of scope.

## Upgrade / downgrade behavior

- **Upgrade** (e.g. Professional → Business): `diffTierModules` reports `added: ["flipbooks",
  "campaigns"]`, `removed: []`. No confirmation is required in the UI for a pure upgrade (nothing
  is being taken away).
- **Downgrade** (e.g. Growth → Solo): reports `removed: ["leads", "booking", "flipbooks",
  "campaigns", "invoices", "money"]`. The Edit Agent page (`app/southline/admin/agents/
  [id]/page.tsx`) computes this diff against the **originally loaded** profile (not the
  in-progress form state) at save time and, if anything would be removed, shows a `confirm()`
  dialog listing exactly what's being added and removed before the PATCH request is sent.
- **Data preservation**: nothing in this change ever deletes Flipbook rows, campaign rows,
  invoice rows, or financial records. Downgrading only flips `modules[key]` to `false` — the
  underlying feature tables (`flip_campaigns`, `campaigns`, `invoices`, etc.) are never touched by
  `applyAgentTier`/`subscribeAgentToTier`, and the confirmation dialog says so explicitly
  ("Removed modules are not deleted data").

## Existing-account compatibility

- Tier bundles are applied **only** through `applyAgentTier`/`subscribeAgentToTier`, both called
  only from explicit operator actions (the PATCH route's tier branch, the billing route's
  subscribe action, the create route when a tier is supplied at creation). No store-layer code,
  no GET handler, and nothing at module load/startup calls either function — a test
  (`no startup/background reconciliation exists`) asserts the store layer stays textually free of
  any reference to the tier-bundling functions.
- A profile with no tier is left alone. The GET handler never calls `applyAgentTier`; reading a
  profile's current `modules` is unaffected by any of this work.
- No backfill was run or written. Existing profiles with legacy `tier` values keep them, resolved
  for display/logic via `resolveAgentTier`, until an operator explicitly re-assigns a tier.

## JSON / Postgres parity

Both `lib/agent-profiles/store-json.ts` and `lib/agent-profiles/store-pg.ts` expose the identical
`update(id, patch): Promise<AgentProfile | undefined>` signature. The JSON store applies a patch
via `Object.assign(profile, patch, ...)`, which sets any own-enumerable key including an explicit
`null`. The Postgres store filters with `if (value !== undefined) set[key] = value` — `undefined`
is skipped ("leave alone"), but `null` passes through and clears the column. Both stores therefore
handle `applyAgentTier`'s "clear tier" path (`tier: null`) identically at the semantic level,
despite the different underlying write mechanisms. `tests/agent-tier-entitlements.test.mjs`
asserts both of these mechanisms are present in source.

## Operator UI

- **Edit Agent form** (`components/agent-profiles/AgentForm.tsx`): tier `<select>` now lists the
  five canonical tiers with display labels; a legacy stored value is resolved to its canonical
  label on load. Picking a tier immediately shows "Plan includes: …" and resets the module
  checkboxes below to that tier's bundle (still hand-editable before saving).
- **Edit Agent page** (`app/southline/admin/agents/[id]/page.tsx`): computes the real
  added/removed diff against the original profile at save time; blocks a module-removing save
  behind a `confirm()` dialog with the specifics spelled out, plus the "not deleted data"
  reassurance.
- **Agent Management panel** (`components/southline/admin/AgentProfilesPanel.tsx`): the
  pending-request activation tier dropdown, the tier column's display label, and the plan-name
  → tier auto-suggest heuristic (`tierFromPlanName`) were all updated to the five canonical
  tiers (with the two legacy plan-name substrings still recognized and mapped to their
  canonical equivalents).

## Server-side validation

Every route resolves `body.tier` through `resolveAgentTier` (or, for the create route,
`resolveAgentTier` feeding `computeTierModules`) rather than a hardcoded 3-value array —
`["basic", "professional", "featured"].includes(...)` no longer appears anywhere in the API
layer. An unresolvable tier throws inside `prepareTierAssignment` before any write happens, and
every route catches that and returns a safe `{ error: message }` — never a raw stack trace,
SQL, or connection string.

## Tests

`tests/agent-tier-entitlements.test.mjs` — **29/29 passing**, covering: canonical tier
resolution, invalid/legacy tier handling, every tier's bundle contents (including the Enterprise
= full-registry set-equality check), upgrade/downgrade/clear diffs, determinism of
`computeTierModules`, the tier-authoritative override behavior (a manually-added module outside
the bundle is gone after the tier is re-applied), source-level guards against fabricated
readiness gates and startup reconciliation, JSON/Postgres parity mechanisms, operator UI preview
and confirmation text, server-side validation replacing the old hardcoded array, the "no
migration" decision, and structural independence from the contractor entitlements system and
Rentals & Getaways.

Regression: `tests/agent-management.test.mjs`, `tests/unified-professional-profile.test.mjs`,
`tests/schema-drift.test.mjs`, `tests/agent-profiles.test.mjs` — **65/65 passing** together with
the new suite. `npx tsc --noEmit` and `npm run build` both clean (verified with a temporary
isolated `distDir`, reverted immediately after). The full repo suite (`node --test
tests/*.test.mjs`) shows 8 unrelated pre-existing failures — 6 are a stale hardcoded git-diff
base-commit check in "Lucio Financial Copilot code is untouched" tests (unrelated to this repo
area entirely), 1 is a pre-existing extensionless-import test-runner quirk
(`tests/agent-pg-review.test.mjs`), and 1 is a concurrent session's in-progress "photographer"
profession-type addition missing its landing-page template (`lib/landing-templates.ts`, a file
this work never touched). None were introduced by this change.

## Architecture boundaries — confirmed untouched

- Contractor `ModuleKey`/`professional_module_entitlements` (`lib/entitlements.ts`,
  `lib/entitlement-types.ts`) — not imported, not referenced, by anything in this change.
- Rentals & Getaways, Southline marketplace products — no file under those areas was touched.
- Stripe Connect, invoice payment collection, payment processors — no new payment code; the
  existing `subscribeTenant`/billing-plan engine (`lib/real-estate/marketplace/billing.ts`) was
  called exactly as it already was, unmodified.
- Public profile routing, Local Discovery, booking architecture, property listing schema — not
  touched.

## Known limitations

- No true cross-call transactional atomicity (see "Subscription behavior" above) — a crash
  between `subscribeTenant()` succeeding and the follow-up `agentProfileStore.update()` in
  `subscribeAgentToTier` would leave a subscription row with no corresponding tier/module update.
  This risk already existed before this change (the original function had the same shape); it is
  not newly introduced, but also not newly fixed.
- No readiness gates exist for agent-side modules (see above) — every module in a tier's bundle
  is unconditionally "on" the moment the tier is assigned, with no downstream check (e.g., "is
  Stripe actually connected") gating whether the feature genuinely functions. This is correct
  per the current state of the codebase, not a shortcut.
- The Option A (tier-authoritative) override model means a manually-granted exception (e.g., "give
  this one Solo customer Invoices as a favor") is silently lost the next time their tier is
  touched at all, even for an unrelated reason. This is a real, documented tradeoff, not an
  oversight — Option B was deliberately not built in this pass (see "Manual overrides" above).

## Recommended next step

If manually-granted exceptions need to survive tier changes, build Option B: a small additive
migration adding a per-profile "operator overrides" field (e.g. `moduleOverrides: { additions:
AgentModuleKey[], exclusions: AgentModuleKey[] }`), with `computeTierModules` extended to apply
tier bundle → additions → exclusions in that order. Otherwise, the next real step for this system
is what this task deliberately did not do: a real payment processor integration (see
`docs/product-packaging/04-billing-and-entitlements-mapping.md` item 1), which is what would let
"SnapLink Business" actually be something a professional pays for, rather than something an
operator assigns by hand.
