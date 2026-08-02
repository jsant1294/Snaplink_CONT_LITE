# Part 4 — Billing & Entitlements Mapping (how 1–3 actually turn on)

This document exists because the previous three are packaging strategy, and packaging strategy
is worthless if it can't be connected to the two real systems already in the codebase: the
billing engine and the module entitlements system. This is the punch list for what makes the
gap between "documented" and "live."

## The two systems that already exist, and how they don't currently talk to each other

**1. Billing engine** (`lib/real-estate/marketplace/billing.ts`) — 🟡 modeled:
- `createBillingPlan(membershipId, { name, billingPeriod, amountCents, currency })` — an operator
  defines a real, priced plan.
- `subscribeTenant(scope, membershipId, { planId })` — creates a subscription row.
- `recordUsage`, `generateInvoice`, `cancelSubscription`, `listSubscriptions`, `listInvoices`.
- Payment collection is a `PreviewPaymentProcessor` today — always succeeds, no real charge.
- Reused for SnapLink tiers via `lib/agent-profiles/billing.ts`'s `subscribeAgentToTier()`, which
  treats each `agent_profiles` row as its own tenant-of-one so the real-estate billing module
  works completely unmodified.

**2. Module entitlements** (`lib/entitlements.ts`, `lib/entitlement-types.ts`) — 🟢 live, but manual:
- `MODULE_KEYS = ["flipbook", "mini_campaigns", "invoices", "money"]`.
- `isModuleEnabled(contractorId, moduleKey)` / `setModuleEnabled(...)` — a real boolean per
  contractor per module, operator-toggled via a real store
  (`professional_module_entitlements` table).
- **This system has no idea the billing/tier system exists.** Setting `tier: "professional"` on
  an agent profile does not enable `mini_campaigns` for that contractor. An operator does that by
  hand, separately, today.

That disconnect is the single biggest gap between this packaging document and a working product.
A customer paying for "SnapLink Business" (which bundles Mini Campaigns and Flipbook per
[01-snaplink-tiers.md](./01-snaplink-tiers.md)) gets neither, automatically, right now.

## Tier → entitlement bundle map (what "included" in Part 1 should mean, mechanically)

| Tier | `flipbook` | `mini_campaigns` | `invoices` | `money` | `featured` flag |
| --- | --- | --- | --- | --- | --- |
| Solo | off | off | off | off | off |
| Professional | off | off | off | off | off |
| Business | **on** | **on** | off | off | off |
| Growth | on | on | **on** | **on** | eligible (see below) |
| Enterprise | on | on | on | on | eligible |

"Eligible" for `featured`, not automatically `true` — Featured Professional Listing
([02](./02-southline-marketplace-products.md)) is framed as an add-on purchase even for
lower tiers and a rotation/weighting model was recommended over a flat flag, so Growth/Enterprise
buying the tier should unlock *eligibility* for that rotation, not silently outrank everyone
else who separately paid for Featured as a standalone add-on.

## Concrete engineering gaps, in rough dependency order

This is the actual build list this packaging work implies. None of it is built by writing this
document — it's what "writing this document" was scoped to *not* do, per the brief.

1. **Register a real `PaymentProcessor`.** This is the true blocker for everything — tiers,
   marketplace products, and the rental lifecycle all sit on the same billing engine, so this is
   one integration, not three. Note this is a *different* Stripe integration than the existing
   Stripe Connect used for contractor→client invoices (`app/api/webhooks/stripe/route.ts`) —
   that one is already real and live for a different purpose (a contractor billing their own
   customer). Platform-level subscription billing (SnapLink charging the professional) needs its
   own Stripe (or other processor) wiring, likely Stripe Billing/Subscriptions.
2. **Tier→entitlement auto-sync.** `subscribeAgentToTier()` should call `setModuleEnabled()` for
   every module the new tier bundles (table above), and the inverse on downgrade/cancellation.
   Currently these are two independent write paths.
3. **Self-serve upgrade/downgrade UI.** Today, tier subscription is only reachable via
   `POST /api/agent-profiles/[id]/billing` — there's no professional-facing "upgrade my plan"
   screen. A professional cannot buy Business or Growth themselves right now.
4. **New `AgentProfileTier` enum values** (`business`, `enterprise`) + a small migration — the
   two tiers this document proposes that don't already exist in code.
5. **Featured-flag purchase gating.** `agent_profiles.featured` and category/trending `featured`
   flags currently mean "an operator set this to true" with no billing relationship. Wiring
   Featured Professional/Rental/Getaway Listing as real products means this flag needs to be
   derived from (or checked against) an active Featured subscription/add-on, not set-and-forget.
6. **Rentals & Getaways commercial schema** — the fields already identified as deferred in
   `docs/rentals-getaways/01-property-model-gaps.md` §4 (`listing_type`, `price_type`,
   `rent_period`/`nightly_rate_cents`, `minimum_stay_nights`, `security_deposit_cents`,
   `pet_policy`, check-in/out, availability, `propertyManagerAgentId`), **plus** the lifecycle-
   specific fields this document's Part 3 needs on top: a publish-lifecycle status distinct from
   the existing `PropertyStatus`, `currentPeriodEnd`/subscription linkage, and a moderation-notes
   field for the `pending_review` → `draft` rejection path.
7. **A scheduled job for lifecycle transitions.** `active → renewal_due → past_due →
   grace_period → hidden` are time-driven, not action-driven — something needs to check
   `currentPeriodEnd` against "now" on a schedule and move listings through these states. **No
   cron/scheduled-task infrastructure exists in this repo today** (checked — no `vercel.json`
   cron config, no cron routes) — this is new infrastructure, not a reuse of something existing.
8. **Sponsored Category / Sponsored Neighborhood content model.** Category sponsorship can reuse
   the existing `SouthlineLocalCategory` structure directly. Neighborhood sponsorship has a
   secondary dependency: Southline discovery today is category/ZIP-driven, not neighborhood-paged
   — there may be no "neighborhood page" to sponsor placement on yet. Confirm this before
   committing to Sponsored Neighborhood as a near-term sellable product; it may need its own small
   content-model addition first, separate from the billing question.
9. **Fair housing / moderation tooling** for rental `pending_review` — this is process and
   possibly legal review, not just code, but the `pending_review` state needs a real reviewer
   workflow (today's closest analog is `agent_profiles.snaplinkStatus`/`southlineStatus`
   draft→published, which has no notes/rejection-reason field to reuse as-is).

## What does *not* need new engineering

Worth stating plainly, since most of this document is gaps: profiles, QR, leads, booking,
Flipbook, Mini Campaigns, Stripe Connect invoices, the billing engine's data model, and the
`basic/professional/featured` tier enum are all real and already work. The packaging in
[01](./01-snaplink-tiers.md) and the Professional/Property-Manager/Builder products in
[02](./02-southline-marketplace-products.md) are closer to "flip a switch" (register a
processor, build a checkout UI) than "build a system." The rental/getaway lifecycle in
[03](./03-paid-rental-lifecycle.md) is the one part of this whole packaging exercise that is a
genuine new build, not a packaging-and-connect job.
