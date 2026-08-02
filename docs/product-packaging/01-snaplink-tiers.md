# Part 1 — SnapLink Product Tiers

Status of everything referenced here: see [00-overview.md](./00-overview.md) for the 🟢🟡🔴
legend. Short version — the profile, QR, leads, booking, Flipbook, Mini Campaigns, and Stripe
Connect invoice features named below are 🟢 real. The tier/billing plumbing that would *sell*
these bundles is 🟡 modeled (real subscription rows, no live charge yet). Nothing below requires
new subsystems — see [04](./04-billing-and-entitlements-mapping.md) for exactly what does.

## Reconciliation with the existing `AgentProfileTier` enum

The codebase already has `type AgentProfileTier = "basic" | "professional" | "featured"`
(`lib/agent-profiles/types.ts`), live in the store and the billing call path
(`subscribeAgentToTier`). Rather than invent five unrelated names, this proposal maps onto it:

| Proposed tier | Existing enum value | Engineering impact |
| --- | --- | --- |
| SnapLink Solo | `basic` (reused) | None — display label only |
| SnapLink Professional | `professional` (reused) | None — name already matches |
| SnapLink Business | *new* `business` | Enum + migration, later |
| SnapLink Growth | `featured` (reused, relabeled in UI) | None — display label only |
| SnapLink Enterprise | *new* `enterprise` | Enum + migration, later |

Three of five tiers need **zero schema change** — only a UI display-label mapping. Two
(Business, Enterprise) need a new enum value whenever this is actually built, which is
deliberately minimized, not five.

---

## SnapLink Solo

**Ideal customer**: one person or a very small operation that wants a basic, credible public
presence and nothing operational yet — a handyman just starting out, a side-gig professional.

| Attribute | Detail |
| --- | --- |
| Included | 1 profile · custom username · photo/logo · contact buttons (call/text/email) · social links · 1 service category · small gallery (recommend 6 photos) · QR code (🟢 real) · basic analytics (profile views only) |
| Excluded | Southline marketplace placement, lead-management workspace, booking, Mini Campaigns, Flipbook, invoices, Money (bookkeeping), multiple users, priority support |
| Profile limit | 1 |
| Media limit | 6 photos, no video |
| Lead limit | N/A — no lead inbox at this tier; contact buttons only, no CRM |
| Booking access | None |
| Campaign access | None |
| QR/NFC | QR included (🟢 real, `app/api/contractor/pay-qr` already generates this). NFC cards sold as a physical add-on SKU, not a tier inclusion — see [00-overview.md](./00-overview.md) "does not exist as software." |
| Southline eligibility | Not eligible for Southline marketplace listing/discovery placement — SnapLink-only presence |
| Support | Community/self-serve (FAQ, docs) |
| Upgrade trigger | Wants to receive and manage leads, wants Southline discovery visibility, wants more than one service category |
| Strategic monthly price range | **$0–$15/mo** (recommended strategy, not committed — likely the free/near-free entry point that makes Professional the real conversion target) |
| Setup fee | None |

## SnapLink Professional

**Ideal customer**: an individual professional who is actively working and needs real leads and
booking, not just a business card.

| Attribute | Detail |
| --- | --- |
| Included | Everything in Solo, plus: lead-management workspace (🟢 `leads` table/routes) · booking (🟢 `/book`, `EstimatorBookingSection`) · up to 3 service categories · expanded gallery (recommend 20 photos + video) · Southline marketplace eligibility (standard, non-featured placement — see [02](./02-southline-marketplace-products.md)) |
| Excluded | Mini Campaigns, Flipbook, Stripe Connect invoices, Money, multi-user/team seats, white-label |
| Profile limit | 1 |
| Media limit | 20 photos + video |
| Lead limit | Recommend unmetered (this tier's core value is leads — don't cap the thing they're paying for) |
| Booking access | Full |
| Campaign access | None |
| QR/NFC | QR included; NFC cards available as paid add-on |
| Southline eligibility | Standard listing (see [02](./02-southline-marketplace-products.md) "Standard Professional Listing") |
| Support | Email support, standard SLA |
| Upgrade trigger | Wants to run promotions (Mini Campaigns), needs a shareable brochure (Flipbook), wants to invoice clients through the platform, or needs more than one service category/team member |
| Strategic monthly price range | **$29–$59/mo** |
| Setup fee | None |

## SnapLink Business

**Ideal customer**: a small business (not a solo operator) that needs marketing tools, booking
operations, and analytics to run day-to-day — the first tier where the business, not just one
person, is the unit.

| Attribute | Detail |
| --- | --- |
| Included | Everything in Professional, plus: Mini Campaigns (🟢) · Flipbook (🟢) · up to 2–3 additional team seats/profiles · expanded analytics (lead source, conversion) · unlimited service categories |
| Excluded | Stripe Connect invoices (billing clients through the platform), Money/bookkeeping module, white-label, dedicated account manager |
| Profile limit | 1 primary + up to 2 additional linked seats (recommend) |
| Media limit | 50 photos + unlimited video |
| Lead limit | Unmetered |
| Booking access | Full, plus calendar/team assignment (if/when multi-seat scheduling exists — currently single-calendar; flag as a gap if team booking is promised at this tier) |
| Campaign access | Mini Campaigns included |
| QR/NFC | QR included; NFC multi-card pack available as add-on |
| Southline eligibility | Standard listing, discounted eligibility for Featured upgrade (see [02](./02-southline-marketplace-products.md)) |
| Support | Priority email + chat |
| Upgrade trigger | Wants to bill clients directly through the platform (Stripe Connect invoices), wants bookkeeping/tax tooling (Money), needs more than ~3 seats, wants a dedicated contact |
| Strategic monthly price range | **$79–$149/mo** |
| Setup fee | Optional $0–$99 (waived on annual commitment) |

## SnapLink Growth

**Ideal customer**: a business ready to actively invest in growth — expanded marketing,
client billing, and financial tooling, not just presence and leads.

| Attribute | Detail |
| --- | --- |
| Included | Everything in Business, plus: Stripe Connect invoices (🟢, bill clients directly) · Money / Lucio Financial Copilot (🟢 bookkeeping, 1099s, quarterly, set-asides) · Southline **Featured** eligibility (reuses existing `featured: true` flag, see [02](./02-southline-marketplace-products.md)) · advanced analytics (funnel, campaign ROI) |
| Excluded | Multi-location/franchise management, white-label branding, custom contract terms, SSO |
| Profile limit | Up to 5 linked seats (recommend) |
| Media limit | Unlimited photos/video |
| Lead limit | Unmetered |
| Booking access | Full |
| Campaign access | Full, plus multiple concurrent campaigns |
| QR/NFC | QR included; NFC pack included (1 bundled, additional at cost) |
| Southline eligibility | Featured-eligible (reuses existing `agent_profiles.featured` boolean and category/trending featured flags — today unpurchased-gated, see [04](./04-billing-and-entitlements-mapping.md) for what wiring that gate requires) |
| Support | Priority + onboarding call |
| Upgrade trigger | Multiple locations, needs white-label/custom branding, needs SSO/team roles beyond ~5 seats, needs a contract instead of self-serve billing |
| Strategic monthly price range | **$199–$349/mo** |
| Setup fee | Optional $99–$299, commonly waived on annual |

*Note: this maps onto the existing `"featured"` enum value. Real-world naming should decide
whether the customer-facing name is "Growth" (marketing framing) while the internal/enum value
stays `featured` — same pattern already used for other internal vs. display-name splits in this
codebase (e.g., `navRealEstate` → `navRentals` rename kept the underlying key stable).*

## SnapLink Enterprise

**Ideal customer**: multi-location businesses, franchises, teams, or accounts needing
white-label presentation or volume/negotiated terms.

| Attribute | Detail |
| --- | --- |
| Included | Everything in Growth, plus: multi-location/multi-profile management under one account · white-label option (remove/replace SnapLink branding) · custom contract & billing terms (off standard self-serve plans) · dedicated account manager · SLA-backed support |
| Excluded | Nothing — this is the ceiling tier |
| Profile limit | Unlimited (negotiated) |
| Media limit | Unlimited |
| Lead limit | Unmetered, with optional dedicated routing/CRM integration |
| Booking access | Full, multi-location calendar |
| Campaign access | Full, multi-brand |
| QR/NFC | Bulk NFC provisioning, white-label QR |
| Southline eligibility | Featured + negotiated placement (e.g., category sponsorship bundled — see [02](./02-southline-marketplace-products.md)) |
| Support | Dedicated account manager, contractual SLA |
| Upgrade trigger | N/A — top of ladder; growth here is expansion (more locations/seats), not tier change |
| Strategic monthly price range | **Custom/negotiated** — recommend anchoring conversations at $499+/mo as a floor, not a published self-serve price |
| Setup fee | Negotiated, typically not waived (onboarding/white-label configuration has real cost) |

---

## Cross-tier notes

- **QR** is 🟢 real infrastructure already shared across the whole platform
  (`app/api/contractor/pay-qr/route.ts` renders a branded PNG for any `https://` URL it's given —
  it isn't tier-specific code, just a URL encoder). Including it at every paid tier costs nothing
  extra to build; it's already built.
- **NFC** should be modeled as a **physical product SKU** (one-time or recurring hardware cost),
  not a software entitlement — there's no NFC module to gate. See [02](./02-southline-marketplace-products.md)
  if a "NFC card pack" line item is wanted as an add-on purchase.
- **Money (Lucio Financial Copilot)** is bookkeeping/tax tooling for the professional's own
  business, not a way to charge their clients. Don't market it as "payments" — that's what the
  Stripe Connect invoices module already does, correctly labeled, at Growth+.
- Every module reference above (`flipbook`, `mini_campaigns`, `invoices`, `money`) already has a
  real per-contractor boolean gate today (`MODULE_KEYS` in `lib/entitlement-types.ts`) — a
  tier→module bundle in this doc is not new capability, it's a proposed *default entitlement set*
  a tier would auto-apply. See [04](./04-billing-and-entitlements-mapping.md) for the gap between
  "documented bundle" and "actually auto-applied on upgrade."
