# BIG PICKLE TAKEOVER — Southline Living Architecture Audit

**Date:** 2026-08-01
**Phase:** A (read-only audit — no migrations, no code changes)
**Deliverable:** answers to the 11 audit questions + a recommendation for Phase B.
**Baseline verified:** `npm run test:agent-management` 21/21 pass, `tests/southline-cms-local-discovery.test.mjs` 43/43 pass, `npx tsc --noEmit` clean, HEAD `791dbdf` on `main` (up to date with origin/main).

> Working tree note: the prior agent left 19 modified + several untracked files (Agent Management in progress). This audit describes the working tree as it exists, so line references match what a continuation agent will see.

---

## Q1. Are professional identities unified or duplicated?

**Not unified — two parallel identity systems.**

| System | Model | Purpose | Public route |
|---|---|---|---|
| Agent Management | `agent_profiles` (Drizzle `agentProfiles`, `lib/agent-profiles/*`) | Realtors / mortgage professionals / other licensed pros | `/p/{username}` (SnapLink, no Southline chrome) + `/agents/{slug}` (Southline chrome, same renderer) |
| Contractor platform | `contractors` (Drizzle, `lib/contractors.ts` seeds, `lib/types.ts` `Contractor`) | Trades / home-services providers | `/contractor/{username}` + `/c/{username}/{slug}` |

The split is deliberate and documented in code:
- `lib/profession-types.ts:9` comment: realtor / mortgage_broker are **excluded** from `PROFESSION_TYPES` because they are served by `lib/agent-profiles/*`.
- `lib/agent-profiles/identity.ts`: SnapLink `username` (`/p/…`) and Southline `slug` (`/agents/…`) are two distinct identifiers sharing one slug grammar; `RESERVED_IDENTIFIERS` + `firstAvailable` keep them unique.

So today: **a realtor is an `AgentProfile`; a roofer is a `Contractor`.** Nothing merges them into one searchable "professional" record. `featuredProfessionalIds` on the Southline homepage mixes both by id with no shared interface (see Q5).

---

## Q2. Which identity model should be the canonical Southline professional profile?

`agent_profiles` is the better fit to become the canonical professional identity:

1. **Already multi-profession.** Table is named `agent_profiles` but nothing forces a realtor-only shape — fields are generic (`name`, `bio`, `serviceArea`, `categories`, `specialties`, `bookingLink`, status axes). It already carries the two status axes Southline needs: `snaplinkStatus` (draft/published/unpublished) and `southlineStatus` (draft/published/featured/hidden).
2. **Reusable public renderer already exists.** `components/agent-profiles/AgentProfilePublicPage.tsx` renders both variants (`"snaplink"` = bare page; `"southline"` = adds Book-a-Consultation / Visit Website / View Full SnapLink Profile CTAs). The contractor renderer (`components/intake/ContractorPublicPage.tsx`) is a separate component.
3. **Independent product boundary is enforced by test** (`tests/agent-management.test.mjs` asserts agent-profiles stays structurally independent of the contractor and multi-tenant real-estate modules).

**Recommendation:** extend `agent_profiles` (or a `professional_profiles` superset) toward a canonical model covering trades too, with a `professionType` that includes both trade ids (from `PROFESSION_TYPES`) and licensed ids (realtor/mortgage/etc.). Do NOT collapse into the `contractors` table — it is deeply wired to the old lead-gen landing pages (`landingPageStore`, `/api/contractor/leads`, notifyNewLead). Keep `contractors` as the runtime record for the existing booking/lead flow (Q7) and let the canonical profile sit on top.

Note: `PROFESSION_TYPES` currently has ~19 trade types; `agent_profiles` has no profession-type enum yet (identity/agent rows imply realtor). Adding a shared `professionType` enum is the key Phase B enabler.

---

## Q3 + Q4. How is the home-services taxonomy defined? Flat vs hierarchical, duplicated, translated, searchable?

**Single canonical source: `lib/services.ts` `SERVICE_LIBRARY`.**

- **59 services** (`ServiceDef[]`) grouped under **10 `SERVICE_CATEGORIES`** (Remodeling & Interior, Painting & Drywall, Flooring, Roofing & Exterior, Plumbing, Electrical, HVAC, Outdoor & Landscape, Concrete & Masonry, Handyman & General).
- Each `ServiceDef` has a canonical **EN name** (the identity used everywhere, e.g. validated against in `app/api/contractor/profiles/route.ts` `VALID_SERVICE_NAMES`) plus an `es` label and a `questionSet` mapping into `lib/questions.ts` (detailed intake questions per service).
- Helpers: `getService(name)`, `groupedServices()`.

**Correction to the handoff brief:** the brief said "approximately 151 services". **The codebase has 59.** I searched for `151` across the repo — no service-count source matches; only a color hex (`#151519` in tailwind.config.ts) and an Unsplash photo id (`photo-151…`) matched. Treat "151" as an unverified/aspirational number. If a 151-service taxonomy exists, it is in a marketing/planning doc, not in code.

**Characterization:**
- **Flat** — services are a single list with a `categoryId`; there is no sub-hierarchy, no parent/child, no synonyms/aliases, no tags. `groupedServices` only buckets them by category.
- **Not duplicated** — one canonical EN identity in `SERVICE_LIBRARY`; trade lists elsewhere (`PROFESSION_TYPES`, category grid `CmsCategory` in `lib/southline-types.ts`) are separate concepts (profession vs service vs content category), not copies of the service list.
- **Translated (partial)** — service `es` label is present, but question banks (`lib/questions.ts`) are the only other ES surfaces; there is no full ES taxonomy (e.g. no `descriptionEs`, no plural/aliases).
- **Searchable — yes, but only via the flat search API (Q5)**, which matches service name substring against contractors' `services[]`; there is no dedicated "browse by service → list of providers" results page.

---

## Q5. Where do home-services search/results live today?

**Only a lightweight overlay + a narrow API. There is no full search-results page.**

- `components/southline/SearchOverlay.tsx` (client): debounced (200ms) fetch to `/api/southline/search?q=…`, renders two groups — DIY projects (link to `/diy/{slug}`) and contractors (link to `/contractor/{username}`).
- `app/api/southline/search/route.ts`: reads `.data/diy-projects.json` + `contractorStore.list()`, substring-matches businessName/tagline/serviceArea/services. **Does NOT search `agent_profiles`, properties, or the service taxonomy itself.** Requires `q.length >= 2`.
- `FeaturedProfessionals` (`components/southline/FeaturedProfessionals.tsx`) renders `Contractor[]` cards only — no agent profiles, no service-based browsing.
- There is **no** `/search`, `/services`, `/professionals`, or `/providers` route. `app/agents/page.tsx` is a directory of published agent_profiles (realtor-focused). `app/homes/page.tsx` is the property/listing page.

**Gap:** the product journey "home-services search/results → professional profile" is not implemented end-to-end for trades. Today a homeowner can search and land on a `/contractor/{username}` page, but there is no category-results listing page, no shared professional card component spanning both identity systems, and no routing that turns a service selection into provider results.

---

## Q6. Is there a reusable professional-profile renderer?

**Partially.**

- `components/agent-profiles/AgentProfilePublicPage.tsx` — **reusable and variant-aware** (`variant: "southline" | "snaplink"`), used by both `/p/{username}` (SnapLink-owned) and `/agents/{slug}` (Southline-wrapped with Header/Footer). This is the component to generalize.
- `components/intake/ContractorPublicPage.tsx` — separate, contractor-specific renderer used by `/contractor/{username}` and `/c/{username}/{slug}`.

They are **not** unified: two components, two page groups, no shared "ProfessionalCard" used by both. `app/agents/[slug]/page.tsx` wraps `AgentProfilePublicPage` with Southline chrome + a `LucioMount` chat widget; `app/contractor/[username]/page.tsx` wraps `ContractorPublicPage` the same way. So the chrome pattern is consistent; the card/renderer is not.

---

## Q7. How do leads/bookings route?

**Contractor-centric, via the old platform:**

- `components/southline/BookingFlow.tsx` (6-step: contractor/service/details/contact/confirm/done) on `app/book/page.tsx` → `POST /api/contractor/leads`.
- `app/api/contractor/leads/route.ts`: requires a valid `contractorUsername` (404 if unknown), validates name/phone/projectType, creates a `Lead` (`lib/types.ts`) with `source: "link"`, persists via `leadStore.create`, then `notifyNewLead` via `after()`.
- Access: operator PIN or contractor PIN (`lib/auth.ts`); `BookingFlow` does not require auth to submit.

Agent profiles do **not** have a lead/booking path of their own yet — `AgentProfile.bookingLink` is a free-form URL (pulled into the Southline variant CTA as an external link, e.g. Calendly). So for realtor/mortgage pros the "lead" is an outbound link; for trades it's a structured lead into SnapLink's workspace.

---

## Q8. Can Local Discovery be repurposed without an external redirect default?

**Yes — the machinery is reusable; the default destination is the blocker.**

- `lib/southline-local-discovery.ts`: `DEFAULT_DIRECTORY_BASE_URL = https://snaplink.southlineone.com/en/local` and `ALLOWED_SNAPLINK_HOSTS = [snaplink.southlineone.com, localhost, 127.0.0.1]` — i.e. today the master toggle, ZIP validation, category mapping, UTM attribution (`DEFAULT_ATTRIBUTION`, `APPROVED_UTM_KEYS`) all point the homeowner **out to SnapLink Local**. `buildSnaplinkLocalUrl` + `LocalDiscovery.tsx` emit `local_search_submitted` analytics events that never block navigation.
- The pieces are cleanly factored: `normalizeUsZip`, `validateSouthlineSettings`, host allowlist, attribution construction, `getOrCreateLocalDiscoverySessionId`. Nothing ties them to an external host except the `DEFAULT_DIRECTORY_BASE_URL` default and the "open in new tab" preview behavior (`LocalDiscoveryEditor.tsx` preview shows the external URL before opening).

**To make Southline own discovery:** point the bridge at a Southline-internal target (e.g. a future `/results` page) or add a `directoryBaseUrl` that resolves to Southline routes, keep ZIP/attribution/analytics, and drop/replace the external-redirect default. This is a config-level change, not a rewrite. Note the project intent (per `docs/local-discovery-bridge/00-overview.md`) was explicitly "hand-off to SnapLink Local; Southline never runs a duplicate directory" — so repurposing is a product decision, not just a code change.

---

## Q9 + Q10. Property models: long-term rentals and short-term stays?

**Long-term rentals: supported.** `lib/real-estate/types.ts` `PropertyStatus` includes `"rental"`; `lib/real-estate/validation.ts` allows status `rental` and `PROPERTY_TYPES` includes `"rental"` (alongside single_family, townhome, condo, multi_family, land, commercial). The `Property` record has price/beds/baths/sqft + amenities, and `/homes` uses `listPublishedPropertiesWithFallback` (real repo → curated `demoProperties` for `demoTenant` only).

**Short-term stays (Airbnb/cabins/vacay): NOT modeled.** No status/type/field for nightly rates, seasonal availability, booking, or stay-type (cabin/vacation home/Airbnb). `demoProperties` and the fixtures are resale listings. Supporting "cabins, vacay homes, Airbnb" would require a new listing subtype (e.g. `propertyType: "short_term_rental"`), nightly-pricing + availability fields, and a booking mechanism — none exist today.

---

## Q11. Smallest safe first slice (Phase B recommendation)

**Do not touch migrations in Phase B.** Everything below is additive, read-mostly, and testable without schema changes (agent_profiles table already ships 0021).

1. **Shared professional card + search results page (highest value, matches the product journey).**
   - Add a `ProfessionalCard` that renders either an `AgentProfile` (slug) or `Contractor` (username) via a small discriminator, with uniform service/location/status fields.
   - Add `/results` (or `/services/[category]`) Southline page + extend `app/api/southline/search/route.ts` to also search `agent_profiles` and match against the `SERVICE_LIBRARY` taxonomy (so searching a service returns providers who offer it, not only substring hits on business names).
   - Reuse Local Discovery's ZIP/attribution/analytics helper functions on this page instead of redirecting out.
2. **Add `professionType` to the canonical profile model** (extend agent_profiles fields to cover trades; backfill seeds in code, not SQL) so the card in (1) is future-proof. This is the groundwork for merging the two identity systems without collapsing the contractor data flow.
3. Leave `contractors` + `/api/contractor/leads` + `BookingFlow` untouched — trades keep their working lead path; the new page just routes homeowners to the existing profile pages.

**Deferred / out of scope:** realtor booking (currently just `bookingLink` outbound), short-term stay listings, merging `ContractorPublicPage` into `AgentProfilePublicPage`, and any DB migration.

---

## Key file index
- Canonical taxonomy: `lib/services.ts` (59 services / 10 categories), `lib/questions.ts`
- Identity: `lib/agent-profiles/types.ts`, `store.ts`/`store-pg.ts`/`store-json.ts`, `identity.ts`, `auth.ts`, `lib/profession-types.ts`
- Renderers: `components/agent-profiles/AgentProfilePublicPage.tsx` (variant-aware), `components/intake/ContractorPublicPage.tsx`
- Routes: `/p/[username]`, `/agents/[slug]`, `/agents`, `/contractor/[username]`, `/c/[username]/[slug]`, `/homes`, `/book`
- Search: `app/api/southline/search/route.ts`, `components/southline/SearchOverlay.tsx`
- Leads/booking: `components/southline/BookingFlow.tsx`, `app/api/contractor/leads/route.ts`
- Local Discovery: `lib/southline-local-discovery.ts`, `components/southline/LocalDiscovery.tsx`, `components/southline/admin/LocalDiscoveryEditor.tsx`
- Property model: `lib/real-estate/types.ts`, `lib/real-estate/validation.ts`, `lib/real-estate/homes-fallback.ts`
- Docs to trust: `docs/architecture/AGENT_MANAGEMENT.md`, `docs/local-discovery-bridge/00-overview.md` + `07-test-results.md`, `REPOSITORY_AUDIT_REPORT.md`

---

## Phase B (implemented 2026-08-01): search results page

**Delivered (additive, no migrations), matching the audit's recommended first slice:**

- **`lib/southline-search.ts`** — pure/store-free unified search over both identity systems. `searchProfessionals(contractors, agents, { query, category })` returns normalized `ProfessionalResult[]` (featured-first). Matches contractors by name/tagline/area/SERVICE_LIBRARY names/profession-type (both langs); agents only when `southlineStatus` is published/featured, matched by name/brokerage/office/tagline/area(s)/specialties/categories/license. Category filter resolves via `categoryIdsForContractor`/`categoryIdsForAgent`. Explicit `.ts` import extensions for Node type-stripping testability (tsconfig has `allowImportingTsExtensions`).
- **`components/southline/ProfessionalCard.tsx`** — one card for both `ProfessionalResult` kinds (placeholder photo for contractors via `professionPlaceholderPhotoFor`, agent photoUrl; `licensedProfessional` badge for agents, `professionTypeLabel` for contractors; CTA text differs: `requestQuote` vs `bookingTitle`).
- **`app/results/page.tsx`** — `/results?q=&category=` server page: search box, category filter chips (10 `SERVICE_CATEGORIES`, preserves q), grid of `ProfessionalCard`, Header/Footer/LucioMount, EN/ES via `sl_lang`.
- **`app/api/southline/search/route.ts`** — now also searches `agentProfileStore` and applies the taxonomy/category logic via the shared lib; returns `{ projects, contractors, agents }`. Contractors/agents now use the uniform shape (`name`/`href`).
- **Wiring** — `SearchOverlay`: form submit routes to `/results?q=…`, adds an agents section + "View all results" footer link; `Hero`: decorative input became a GET `<form action="/results" name="q">`.
- **Guards** — `results` added to `RESERVED_IDENTIFIERS`; new i18n keys (`resultsTitle`, `resultsSubtitle`, `resultsEmpty`, `resultsAll`, `resultsFilterLabel`, `resultsViewAll`, `licensedProfessional`).
- **Tests** — `tests/southline-search.test.mjs` (16 tests, `npm run test:southline-search`), covering taxonomy matching, category filtering, agent publish-status gating, featured sorting, and route/component wiring via source assertions.

**Verification:** `tsc --noEmit` clean, `npm run build` succeeds (includes `/results`), `test:southline-search` 16/16, `test:agent-management` 21/21, local-discovery 43/43.

**Known pre-existing failure (not caused by this pass):** `tests/southline-form-visibility.test.mjs` "LFC tax/payment code is untouched" diffs against `ba05d9c` (3 commits behind HEAD); the LFC files changed in later commits `41b6393`/`51be33f`, so it fails on clean HEAD regardless of this work.

**Not done (deliberately out of Phase B scope):** merging `ContractorPublicPage` into `AgentProfilePublicPage`, `professionType` on agent_profiles, realtor bookingLink→structured lead, short-term-stay listings, any migration.
