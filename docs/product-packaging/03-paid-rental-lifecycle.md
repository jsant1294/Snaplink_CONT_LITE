# Part 3 — Paid Rental & Getaway Architecture

**🔴 Needs engineering, entirely.** This document is target architecture, not a description of
anything running today. Read [00-overview.md](./00-overview.md) if you haven't — the short
version is that the team currently building Rentals & Getaways already audited this exact gap
and deferred it (`docs/rentals-getaways/01-property-model-gaps.md`, section 4, "Recommended
full-product model (deferred, for docs 08)"). This document is written as a candidate for that
deferred slot — it should be reconciled with that team before any of it is built, not built
independently of it.

The nine states below (`draft` through `archived`) were specified exactly as given. The
transitions, triggers, side effects, and edge-case handling are this document's proposal to
complete that state machine — flagged clearly so it's obvious what was specified versus
designed here.

## What already exists to build this on

From `docs/rentals-getaways/01-property-model-gaps.md` (verified, not assumed):

- One `Property` shape, one `real_estate_properties` table. `PropertyStatus` already has a
  `"rental"` value, but it's currently **just a display filter** — no purpose (`listingType`),
  price type, availability, deposit, or pet-policy fields exist. Today's `/rentals` page is a
  **display-only reuse**: rows published as `propertyStatus: "rental"` render on a landing page;
  nothing about payment, moderation gating, or expiry exists.
- The gap doc's own deferred list is exactly the schema this lifecycle needs:
  `listing_type`, `price_type`, `rent_period`/`nightly_rate_cents`, `minimum_stay_nights`,
  `security_deposit_cents`, `pet_policy`, `check_in_time`/`check_out_time`,
  `availability_start`/`end`, `propertyManagerAgentId`. **This document does not re-derive that
  list — it defers to it as the prerequisite schema work**, and adds only what the *commercial
  lifecycle* needs on top: a status field distinct from `PropertyStatus` (publish state) and
  payment/term tracking.
- The billing engine this lifecycle should sit on already exists and is real code:
  `lib/real-estate/marketplace/billing.ts` (plans, subscriptions, usage records, invoices — see
  [00-overview.md](./00-overview.md)). **Recommendation: do not build a third billing system for
  rentals.** A rental listing's paid term should be a `realEstateBillingSubscriptions` row (or
  the Southline-side equivalent, if listings shouldn't share a table with real-estate SaaS
  billing — a decision for whoever builds this, not this document), with `billingPeriod` mapped
  to the listing term length.

## State machine

```text
                    ┌─────────────────────────────────────────────┐
                    │                                               │
                    ▼                                               │
   draft ──submit──▶ payment_required ──payment succeeds──▶ pending_review
     ▲                     │                                    │
     │                 (abandon/                          reject + notes
     │                  timeout)                                │
     │                     │                                    ▼
     └─────────────────────┘                                  draft
                                                                  │
                                                             approve
                                                                  ▼
                                                               active
                                                                  │
                                                        term approaching end
                                                                  ▼
                                                            renewal_due
                                                          /              \
                                                  renewal paid      term expires
                                                        │             unpaid
                                                        ▼                ▼
                                                     active           past_due
                                                                          │
                                                                    short window
                                                                          ▼
                                                                   grace_period
                                                                    /         \
                                                          payment resolved   window expires
                                                                │                  │
                                                                ▼                  ▼
                                                             active             hidden
                                                                                    │
                                                                          extended inactivity
                                                                          or owner deletes
                                                                                    ▼
                                                                                archived
```

Owner-initiated pause is a separate edge, not drawn above for clarity: `active`,
`renewal_due`, `past_due`, or `grace_period` can all transition directly to `hidden` if the
owner chooses to pause the listing themselves, independent of payment status.

## State definitions

### `draft`
- **Entry**: new listing created; or moderation rejected a `pending_review` submission and
  returned it here with reviewer notes (see "Moderation rejection" below — this isn't a separate
  state, it's a return to `draft`, to avoid inventing a state beyond the given nine).
- **Owner can**: edit freely — photos, description, pricing, availability (once that schema
  exists per the gap doc).
- **Visibility**: never public.
- **Billing**: no subscription/charge exists yet.
- **Exit**: owner submits → `payment_required`.

### `payment_required`
- **Entry**: owner submits a complete draft for publishing.
- **Owner sees**: a checkout/payment step for the listing plan (Standard or Featured, per
  [02](./02-southline-marketplace-products.md) — the plan choice determines the
  `realEstateBillingPlans` row used).
- **Visibility**: never public.
- **Billing**: a subscription is created in a pending state, or created only on successful
  payment (implementation choice — recommend creating the subscription row only on success, to
  avoid orphaned pending-forever rows).
- **Timeout**: recommend an abandonment timeout (e.g., 7 days) that reverts to `draft` if payment
  is never completed, so incomplete checkouts don't linger indefinitely.
- **Exit**: payment succeeds → `pending_review`. Payment abandoned/times out → `draft`.

### `pending_review`
- **Entry**: payment succeeded.
- **Visibility**: never public — this is explicitly a moderation gate, not a paid-therefore-live
  shortcut. Southline should never show an unreviewed listing just because it was paid for.
- **Moderation checklist** (recommended, not exhaustive): real property/address plausibility,
  photo quality/authenticity, no discriminatory language (fair-housing compliance is a real legal
  requirement for rental listings — this is not optional), pricing sanity.
- **Moderation rejection**: returns to `draft` with reviewer notes attached to the listing so the
  owner can see exactly what to fix. **Recommend the payment is preserved, not refunded**, and
  applied automatically to the next successful submission within some window (e.g., 30 days) —
  refund-on-every-rejection creates a bad incentive loop for a listing that just needs a photo
  swap. This is a policy decision to confirm before building, not a technical constraint.
- **Exit**: approved → `active`. Rejected → `draft`.

### `active`
- **Visibility**: fully public — appears in `/rentals` (or `/getaways`) search/results, inquiry
  form is live, Featured elevation (if purchased) applies.
- **Billing**: subscription in good standing, `currentPeriodEnd` in the future.
- **Lead routing**: inquiries route to the owner via the existing inquiry/lead flow pattern
  already scoped in `docs/rentals-getaways/04-inquiry-and-lead-flow.md`.
- **Exit**: term approaches expiry → `renewal_due`. Owner pauses → `hidden`.

### `renewal_due`
- **Entry**: recommend triggering a fixed window before `currentPeriodEnd` (e.g., 14 days out) —
  this is a *notice* state, not a visibility change.
- **Visibility**: still fully public and active — nothing changes for site visitors; this state
  exists to trigger owner-facing renewal notifications (email/dashboard banner).
- **Exit**: renewal paid → back to `active` with a new `currentPeriodEnd`. Term expires unpaid →
  `past_due`.

### `past_due`
- **Entry**: `currentPeriodEnd` passed with no renewal payment.
- **Visibility**: recommend **still visible** at this point (a short unpaid lapse shouldn't
  instantly de-list a real listing — that's punitive to an owner who missed one email) —
  decision to confirm, but this document's recommendation is visible-with-a-past-due-banner in
  the owner dashboard, not hidden yet.
- **Exit**: payment resolved → `active`. Continues unresolved → `grace_period`.

### `grace_period`
- **Entry**: `past_due` continues beyond a short additional window (recommend 3–7 days total from
  original expiry, i.e., a brief cushion, not weeks).
- **Visibility**: recommend downgrading here — still technically findable by direct link, removed
  from search/category results. This is the actual "about to disappear" signal to the owner,
  distinct from `past_due`'s softer treatment.
- **Exit**: payment resolved → `active`. Window expires unresolved → `hidden`.

### `hidden`
- **Entry**: grace period expired unpaid, or owner manually paused the listing (from any active
  state), or moderation removed a previously-active listing for a policy violation (a case this
  document adds since "active listing gets pulled for a legitimate reason" is a real operational
  need not covered by the given nine states — flagged as an addition, not part of the original
  spec).
- **Visibility**: not public, not findable by direct link either (fully hidden, distinct from
  `grace_period`'s "findable by link only").
- **Data retention**: full listing data retained — this is a suspend, not a delete.
- **Reactivation**: owner can reactivate, which routes back through `payment_required` (a fresh
  payment/term), not directly to `active` — a hidden listing's term has lapsed, so re-entry
  should always go through payment.
- **Exit**: owner reactivates → `payment_required`. Extended inactivity (recommend 90+ days) or
  explicit owner deletion request → `archived`.

### `archived`
- **Entry**: extended hidden inactivity, or explicit owner deletion.
- **Visibility**: not public, not reactivatable through normal self-serve flow.
- **Data retention**: recommend retaining for a defined period (e.g., 1 year) for legal/audit
  purposes, then eligible for actual deletion per whatever data-retention policy the business
  adopts — that's a legal/compliance decision, not an engineering one, and out of scope here.
- **Exit**: none in normal operation. If a business reason requires restoring an archived
  listing, recommend that be an operator-assisted action (support request), not a self-serve
  button — archiving should mean something.

## Payment processor dependency

None of this can process a real charge until a live `PaymentProcessor` is registered with the
existing billing engine (see [00-overview.md](./00-overview.md) — today it's a
`PreviewPaymentProcessor` that always succeeds). Building this lifecycle without also wiring a
real processor would produce a listing flow where every "payment" silently succeeds — fine for
demoing the state machine, not fine for launch. This dependency is shared with Part 1/2's
tier/plan billing (see [04](./04-billing-and-entitlements-mapping.md)) — one processor
integration unblocks all of it, not three separate ones.

## Fair housing note

Rental listings carry real legal exposure (fair housing law) that sale listings and professional
profiles don't carry in the same way. The moderation step in `pending_review` is not optional
polish — it's risk mitigation. This should be scoped with legal input before `active` is ever
reachable in production, independent of the payment/lifecycle engineering.
