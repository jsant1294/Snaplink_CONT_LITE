# SnapLink & Southline Living — Product Packaging Architecture

Mode: strategy and documentation only. Nothing in this directory changes application code,
schema, or behavior. It is a business/architecture proposal to be reviewed, not a build order.

## Why this set of documents exists

The originating brief asked for pricing tiers, marketplace products, and a paid rental
lifecycle, "grounded in the capabilities already evidenced in the repository." Before writing
those, the repo was audited directly (not from memory) to separate three different states of
readiness that the brief's "Confirmed platform ownership" section blends together. That
grounding is the spine of every document in this folder — every tier and product below is
tagged with one of these three statuses:

| Tag | Meaning |
| --- | --- |
| 🟢 **Live** | Real, shipped, working code today. Verified by reading the actual route/component/table, not inferred from naming. |
| 🟡 **Modeled** | The data model and/or business logic exists, but a real payment processor, enforcement path, or UI is not wired up — so it cannot yet collect money or auto-enforce access. |
| 🔴 **Needs engineering** | Does not exist. Proposed here as target architecture; building it is future work, not a packaging exercise. |

## What was verified in the repo (2026-08-01)

**🟢 Live and confirmed by reading the code:**
- Public profiles (`/p/{username}`), custom username, photo/logo, contact buttons, social
  links, service categories, gallery — `agent_profiles` table + `AgentProfilePublicPage`.
- QR: real PNG generation (`app/api/contractor/pay-qr/route.ts`, the `qrcode` package) — not a
  stub.
- Leads, booking (`/book`, `EstimatorBookingSection`).
- Flipbook — full CRUD + public viewer (`app/f/[token]/page.tsx`,
  `app/api/contractor/flipbook/**`, `lib/store-flipbook-{json,pg}.ts`).
- Mini Campaigns (`lib/campaign-types.ts`, `lib/store-campaign-{json,pg}.ts`).
- Stripe Connect invoices — a contractor invoicing *their own client* (`app/api/contractor/
  invoices/**`, `app/api/webhooks/stripe/route.ts`, real `stripe` dependency). This is separate
  from platform billing (see below).
- Module entitlements — binary, operator-toggled, per contractor
  (`lib/entitlements.ts`, `lib/entitlement-types.ts`,
  `professional_module_entitlements` table). Gated modules today: `flipbook`, `mini_campaigns`,
  `invoices`, `money`.
- Money / Lucio Financial Copilot — expense, 1099, quarterly, payee, set-aside tracking for a
  contractor's own books. This is bookkeeping, not a way to charge clients — don't conflate it
  with "payments" as a merchant-processing feature.
- Local Discovery, unified search, Southline homepage sections, DIY/Ideas.
- Homes for sale (real estate marketplace).

**🟡 Modeled but not collecting real money or auto-enforcing today:**
- **A real plan/subscription/invoice billing engine already exists**:
  `lib/real-estate/marketplace/billing.ts`. Operators create plans (`createBillingPlan`: name,
  `billingPeriod` of `monthly | annual | usage`, `amountCents`, currency) via
  `POST /api/real-estate/billing/plans`. Tenants subscribe (`subscribeTenant`), usage can be
  metered (`recordUsage`), invoices generate (`generateInvoice`). No amount is invented by this
  engine — an operator supplies real numbers.
- Its payment step is a `PreviewPaymentProcessor` that always returns `"paid"` unless a real
  `PaymentProcessor` is registered via `registerPaymentProcessor()` — which nothing in the repo
  currently does. **Every subscription/invoice this engine produces today is a ledger entry, not
  a real charge.** This is the single most important fact for any pricing document: strategy can
  be written now, collection cannot happen until a processor is registered.
- **Agent profile tiers already exist** as a real enum: `AgentProfileTier = "basic" |
  "professional" | "featured"` (`lib/agent-profiles/types.ts`), wired to the billing engine above
  via `subscribeAgentToTier()` (`lib/agent-profiles/billing.ts`), which treats each profile as
  its own "tenant of one" so the real-estate billing module works unmodified. This is real,
  callable code — `POST /api/agent-profiles/[id]/billing` with `{ action: "subscribe", tier,
  planId }` already works end to end (creates a subscription row) — it just isn't connected to a
  live charge, and there is no self-serve upgrade UI for a professional to do this themselves.
- `featured: boolean` already exists on `agent_profiles` and on Southline category/trending
  items, as a display flag. It is not currently purchase-gated — anyone with the flag set shows
  as featured, regardless of billing status.
- Real-estate billing tables (`realEstateBillingSubscriptions`, `realEstateBillingInvoices`,
  `realEstateBillingPlans`, `realEstateBillingUsageRecords`) are the same tables the agent-profile
  tier system reuses — there is one billing engine in this codebase, not several.

**🔴 Does not exist, and is out of scope for a packaging pass to assume:**
- NFC is FAQ/marketing copy describing a physical product (a card that deep-links to an
  already-existing profile URL). There is no NFC software module — nothing to gate or price as a
  feature flag. Sell it as a physical SKU, not a subscription tier inclusion.
- The paid rental/getaway commercial lifecycle (draft → payment_required → ... → archived) does
  not exist. More importantly: **the team already building Rentals & Getaways has identified this
  exact gap themselves** — `docs/rentals-getaways/01-property-model-gaps.md` has a section
  literally titled "Recommended full-product model (deferred, for docs 08)." [03-paid-rental-
  lifecycle.md](./03-paid-rental-lifecycle.md) is written as a proposal to fill that deferred
  slot, cross-referenced against what that audit already found — not as something ready to
  switch on.
- Sponsored category/neighborhood placement, Community Partner, Builder/Developer plan — no
  code exists for any of these. They're modeled in [02](./02-southline-marketplace-products.md)
  as new billing-plan instances on the existing engine, not new subsystems.

## Reconciliation approach (the decision this packaging exercise makes)

The brief's Part 1 asks for five new SnapLink tiers (Solo/Professional/Business/Growth/
Enterprise). The repo already has three (`basic/professional/featured`), live in the type
system, the store, and the billing call path. Two options existed:

1. Invent five new tier names with no relationship to the existing enum — clean on paper, but it
   would either strand the existing `tier` column and `subscribeAgentToTier()` call, or require an
   immediate schema/type migration just to make the packaging doc true. That's implementation,
   which this pass is explicitly not allowed to do.
2. **Treat the five tiers as an extension of the existing three, mapped explicitly.** No schema
   change is implied by the documentation itself; the mapping is the migration plan for whenever
   engineering picks this up.

This document set takes option 2. See the mapping table in
[01-snaplink-tiers.md](./01-snaplink-tiers.md).

Southline marketplace products (Part 2) are modeled the same way: every listing/plan is a
`realEstateBillingPlans` row (or its Southline-side equivalent, if a parallel table is preferred
later — see [04](./04-billing-and-entitlements-mapping.md)) with a real `amountCents` an operator
sets, not a new billing subsystem.

## Reading order

1. [01-snaplink-tiers.md](./01-snaplink-tiers.md) — Part 1
2. [02-southline-marketplace-products.md](./02-southline-marketplace-products.md) — Part 2
3. [03-paid-rental-lifecycle.md](./03-paid-rental-lifecycle.md) — Part 3
4. [04-billing-and-entitlements-mapping.md](./04-billing-and-entitlements-mapping.md) — how 1–3
   wire onto the existing billing engine and entitlements system, and exactly what engineering
   work (payment processor, self-serve upgrade UI, tier→entitlement auto-sync) turns this from a
   pricing document into a working product.

## Pricing disclaimer

Every dollar figure in this folder is a **recommended strategy range**, not a committed price.
None of it is hardcoded anywhere in the application — the billing engine takes real
operator-supplied `amountCents` at plan-creation time, so nothing here needs to match code; code
needs to eventually match whatever pricing is actually decided.
