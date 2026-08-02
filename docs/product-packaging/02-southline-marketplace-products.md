# Part 2 — Southline Living Marketplace Products

All eleven products below are proposed as **plan rows on the existing billing engine**
(`lib/real-estate/marketplace/billing.ts` — `createBillingPlan` / `subscribeTenant`), the same
mechanism already used for SnapLink agent-profile tiers. None of these need a new billing
subsystem. See [04-billing-and-entitlements-mapping.md](./04-billing-and-entitlements-mapping.md)
for exactly how a plan → listing gate would be wired.

Grounding: `home_builder` and `pool_builder` already exist in `PROFESSION_TYPES`
(`lib/profession-types.ts`), and `property_manager` already exists in
`LICENSED_PROFESSION_TYPES` — Builder/Developer and Property Manager plans below map onto real,
existing identity types, not invented personas.

---

## Standard Professional Listing

**🟡 Modeled** — the listing itself (`agent_profiles`, `/agents/{slug}`) is 🟢 real; the "you must
pay to appear" gate is not wired.

| Attribute | Detail |
| --- | --- |
| Who buys it | Any SnapLink Professional-tier+ account (bundled — see [01](./01-snaplink-tiers.md)) |
| Included | One Southline discovery listing, standard placement in search/category results, standard profile card |
| Not included | Priority ranking, homepage placement, category-page pinning, badge/highlight styling |
| Billing model | Bundled with SnapLink Professional+ tier — not sold standalone (a Solo-tier account is not Southline-eligible at all, see [01](./01-snaplink-tiers.md)) |
| Listing duration | Tied to active subscription — listing hides when subscription lapses (mirrors the rental lifecycle's `hidden` state proposed in [03](./03-paid-rental-lifecycle.md), for consistency) |
| Renewal model | Auto-renews with the underlying SnapLink subscription |
| Moderation | Operator review on first publish (existing `snaplinkStatus`/`southlineStatus` draft→published flow already does this) |
| Visibility level | Standard — appears in search/category results in normal ranked order |
| Lead routing | Directly to the professional's SnapLink lead inbox (🟢 real) |
| SnapLink requirement | Must have an active SnapLink Professional-tier-or-above account |
| Optional upgrades | Featured Professional Listing (below) |

## Featured Professional Listing

**🟡 Modeled** — `featured: boolean` already exists on `agent_profiles` and is read by homepage/
category rendering; it is not currently purchase-gated (anyone with the flag set shows featured
regardless of billing).

| Attribute | Detail |
| --- | --- |
| Who buys it | SnapLink Growth-tier+ accounts (bundled), or Professional/Business-tier accounts as a standalone add-on purchase |
| Included | Everything in Standard, plus: priority ranking within category/search results, eligibility for homepage "Featured Professionals" rail, highlighted card styling |
| Not included | Guaranteed #1 placement (recommend a rotation/weighting model among featured accounts, not a fixed slot, to avoid a "who paid most" arms race) |
| Billing model | Included at Growth+ tier; standalone add-on plan for Professional/Business (recurring, e.g. monthly) |
| Listing duration | Tied to the featured subscription/add-on period |
| Renewal model | Auto-renew; reverts to Standard on lapse (flag flips off, listing stays live) |
| Moderation | Same first-publish review as Standard, plus a lightweight quality bar for featured eligibility (complete profile, recent activity) |
| Visibility level | Elevated — priority rank + homepage eligibility |
| Lead routing | Same as Standard |
| SnapLink requirement | Active SnapLink account, Professional-tier or above |
| Optional upgrades | Sponsored Category (below), for category-specific dominance beyond general featuring |

## Standard Rental Listing

**🔴 Needs engineering** — see [03-paid-rental-lifecycle.md](./03-paid-rental-lifecycle.md).
Today `/rentals` is a landing/informational page with an inquiry/lead flow
(`docs/rentals-getaways/04-inquiry-and-lead-flow.md`), not a paid per-listing product.

| Attribute | Detail |
| --- | --- |
| Who buys it | Individual rental property owners/managers |
| Included | One rental listing (photos, description, availability calendar if built, inquiry routing) |
| Not included | Featured placement, homepage rail eligibility |
| Billing model | Flat fee per listing period (see Part 3 for the `payment_required` gate) |
| Listing duration | Fixed term (recommend 30/90/365-day options) |
| Renewal model | Manual or auto-renew at owner's choice; enters `renewal_due` before expiry (Part 3) |
| Moderation | `pending_review` state required before `active` (Part 3) — property legitimacy, photo quality, no discriminatory language |
| Visibility level | Standard |
| Lead routing | Inquiry → owner, via the existing inquiry/lead flow pattern already scoped for Rentals & Getaways |
| SnapLink requirement | None strictly required — rentals can be owner-direct, not tied to a SnapLink professional account (differs from Professional Listings, which require a SnapLink account) |
| Optional upgrades | Featured Rental Listing |

## Featured Rental Listing

**🔴 Needs engineering** — same dependency as Standard Rental Listing.

| Attribute | Detail |
| --- | --- |
| Who buys it | Rental owners wanting priority visibility, especially in competitive seasons/markets |
| Included | Everything in Standard, plus priority ranking, homepage/category rail eligibility, highlighted card |
| Not included | Guaranteed top slot (same rotation/weighting recommendation as Featured Professional) |
| Billing model | Premium flat fee or percentage uplift over Standard, per listing period |
| Listing duration | Same term options as Standard; featured status can be a shorter add-on window layered on top (e.g., feature for 14 of a 90-day listing) |
| Renewal model | Featured add-on renews independently of the base listing term |
| Moderation | Same as Standard, plus quality bar for featured eligibility |
| Visibility level | Elevated |
| Lead routing | Same as Standard |
| SnapLink requirement | None |
| Optional upgrades | Sponsored Neighborhood, if the owner has multiple properties in one area |

## Standard Getaway Listing

**🔴 Needs engineering** — same lifecycle dependency as rentals; getaways are the short-term/
vacation variant of the same underlying property model per the Rentals & Getaways audit.

| Attribute | Detail |
| --- | --- |
| Who buys it | Short-term/vacation property owners or managers |
| Included | One getaway listing, photos, description, availability |
| Not included | Featured placement |
| Billing model | Flat fee per listing period, or percentage-of-booking if a booking/payment flow is eventually built for getaways (out of scope here — flag as a future decision, not assumed) |
| Listing duration | Fixed term, likely shorter defaults than rentals (seasonal turnover) |
| Renewal model | Same `renewal_due` pattern as rentals |
| Moderation | Same `pending_review` requirement |
| Visibility level | Standard |
| Lead routing | Inquiry → owner |
| SnapLink requirement | None |
| Optional upgrades | Featured Getaway Listing |

## Featured Getaway Listing

**🔴 Needs engineering** — same dependency.

| Attribute | Detail |
| --- | --- |
| Who buys it | Getaway owners wanting seasonal visibility spikes |
| Included | Everything in Standard, plus priority ranking and homepage/category rail eligibility |
| Not included | Guaranteed top slot |
| Billing model | Premium fee, likely with seasonal pricing (e.g., higher during peak booking windows) — recommend as strategy, not a hardcoded seasonal price table |
| Listing duration | Same as Standard Getaway, featured add-on layered on top |
| Renewal model | Featured add-on renews independently |
| Moderation | Same as Standard, plus quality bar |
| Visibility level | Elevated |
| Lead routing | Same as Standard |
| SnapLink requirement | None |
| Optional upgrades | Sponsored Neighborhood |

## Property Manager Plan

**🟡 Modeled** — `property_manager` already exists as a real identity type in
`LICENSED_PROFESSION_TYPES`; the multi-property management billing/plan wrapper does not exist.

| Attribute | Detail |
| --- | --- |
| Who buys it | Companies/individuals managing multiple rental properties on behalf of owners |
| Included | Multiple rental listings under one account, bulk listing management, consolidated lead inbox across managed properties, `property_manager` professional profile (already a supported identity type) |
| Not included | Getaway-specific tooling (separate plan if a manager also handles short-term units) |
| Billing model | Recurring monthly/annual, tiered by number of managed units (matches the existing billing engine's `usage`-period option for a metered-per-unit model) |
| Listing duration | Rolling — tied to active subscription, not per-listing terms like individual owner listings |
| Renewal model | Auto-renews with the plan subscription |
| Moderation | Business verification at signup (licensing where applicable — `licenseNumber`/`licenseState` fields already exist on the profile model) |
| Visibility level | Standard per listing, with Featured available as an add-on per property |
| Lead routing | Consolidated inbox, then internal assignment (manager's own process — platform just routes to the account) |
| SnapLink requirement | Recommend requiring a SnapLink Business-tier+ account, since this is inherently a multi-property business operation |
| Optional upgrades | Featured Rental/Getaway Listing per managed property, Sponsored Neighborhood if concentrated in one area |

## Builder/Developer Plan

**🟡 Modeled** — `home_builder`/`pool_builder` already exist as real trade identity types.

| Attribute | Detail |
| --- | --- |
| Who buys it | Home builders, developers, remodeling companies with new construction or development projects to showcase |
| Included | Project showcase pages (beyond a single listing — a builder markets a development, not one unit), lead capture per project, builder profile with portfolio gallery |
| Not included | Individual for-sale home listings (that's the existing Homes marketplace, a separate product) |
| Billing model | Recurring monthly/annual, or per-project flat fee for a defined marketing window |
| Listing duration | Per-project term (recommend tied to construction/sales timeline, e.g., 6–12 months, renewable) |
| Renewal model | Manual renewal tied to project timeline, not auto-renew by default (a finished project shouldn't keep auto-billing) |
| Moderation | Verification of licensing/business legitimacy before publish |
| Visibility level | Standard, with Featured/Sponsored Category available for competitive markets |
| Lead routing | Project inquiry → builder's lead inbox |
| SnapLink requirement | Recommend Business-tier+ account |
| Optional upgrades | Sponsored Category (e.g., "New Construction"), Sponsored Neighborhood for a development's specific area |

## Community Partner

**🔴 Needs engineering** — pure new product; no analog exists today.

| Attribute | Detail |
| --- | --- |
| Who buys it | Local businesses adjacent to home/property (mortgage lenders, insurance agents, moving companies, local vendors) who want visibility on Southline without being a licensed real-estate professional or contractor |
| Included | A directory-style partner listing (lighter-weight than a full professional profile), logo/link placement in relevant content (e.g., a mortgage lender on the Homes pages) |
| Not included | Full profile features (booking, campaigns, Flipbook — those are SnapLink professional-tier features, not partner features) |
| Billing model | Flat recurring sponsorship fee |
| Listing duration | Term-based (recommend quarterly/annual) |
| Renewal model | Manual or auto-renew, operator's choice per partner relationship |
| Moderation | Manual operator approval — this is a direct sales relationship, not self-serve signup, at least initially |
| Visibility level | Contextual placement (e.g., appears near relevant content), not general search ranking |
| Lead routing | Partner-specific — likely a simple click-through/contact link, not a full lead inbox |
| SnapLink requirement | None — this is explicitly for businesses that don't fit the SnapLink professional model |
| Optional upgrades | Sponsored Category if the partner wants deeper placement in one vertical (e.g., "Insurance") |

## Sponsored Category

**🔴 Needs engineering** — no code exists; category ownership/routing (`destination:
"southline"|"snaplink"` on `SouthlineLocalCategory`) is a *routing* concept already built, not a
*monetization* concept. This product would sit on top of that existing routing, not replace it.

| Attribute | Detail |
| --- | --- |
| Who buys it | Any professional/business wanting category-level dominance (e.g., top placement across all "Roofing" results) |
| Included | Priority placement across an entire category's results/cards, category-page banner eligibility |
| Not included | Placement outside the sponsored category |
| Billing model | Recurring, likely priced higher than general Featured given concentrated exposure; possibly exclusive-per-category (one sponsor at a time) or shared rotation — recommend deciding this before building, since it changes the pricing model significantly (exclusivity commands premium pricing) |
| Listing duration | Term-based (recommend monthly minimum, quarterly discount) |
| Renewal model | Auto-renew, with the sponsor notified before a competitor could claim the slot if exclusive |
| Moderation | Operator-approved, given the exclusivity/premium stakes |
| Visibility level | Category-wide elevated |
| Lead routing | Same as the underlying listing type (professional or rental/getaway) |
| SnapLink requirement | Must already have an active Standard or Featured listing in that category — sponsorship is an amplifier, not a replacement |
| Optional upgrades | Sponsored Neighborhood, for geographic + category combined dominance |

## Sponsored Neighborhood

**🔴 Needs engineering** — no code exists.

| Attribute | Detail |
| --- | --- |
| Who buys it | Professionals/businesses/builders with concentrated presence or interest in one specific area |
| Included | Priority placement for results filtered/searched within that neighborhood, neighborhood-page banner eligibility (if/when neighborhood-specific pages exist — currently Southline discovery is category/ZIP-driven, not neighborhood-paged, so this may require its own small content-model addition, distinct from the billing question) |
| Not included | Placement outside the sponsored neighborhood |
| Billing model | Recurring, priced by neighborhood competitiveness/market size — strategy range, not fixed |
| Listing duration | Term-based |
| Renewal model | Auto-renew |
| Moderation | Operator-approved |
| Visibility level | Neighborhood-scoped elevated |
| Lead routing | Same as underlying listing type |
| SnapLink requirement | Must already have an active Standard or Featured listing |
| Optional upgrades | Combine with Sponsored Category for the strongest available placement |

---

## Cross-product notes

- Every "Featured" and "Sponsored" product reuses the same underlying mechanism: a paid,
  time-bound elevation of an already-existing listing. None of them are new listing *types* —
  they're purchasable states layered on top of Standard listings. This keeps the eventual
  implementation to one state machine with modifiers, not eleven separate systems.
- Rental/Getaway products are the ones most dependent on new engineering (Part 3). Professional
  and Property Manager/Builder products are closer to sellable today because the underlying
  listing entities (`agent_profiles`, profession types) already exist — only the payment gate is
  missing.
