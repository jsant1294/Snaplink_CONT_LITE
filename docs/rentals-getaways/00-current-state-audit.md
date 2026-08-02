# Rentals & Getaways — Current-State Audit

> Part of the **Big Pickle — Rentals & Getaways Takeover Slice**.
> This document captures exactly how the property/navigation stack works today,
> before any changes. Written `2026-08-01`.

## 1. Scope of this slice

Take the existing "Real Estate" surface on **Southline Living** and reframe it as
**Rentals & Getaways** (ES: **Alquileres y Escapadas**):

- Restructure the primary navigation to `Home | Homes | Rentals & Getaways |
  Ideas | Projects | DIY | Professionals | Book` (ES labels as specified).
- Build an image-driven `/rentals` landing page.
- Preserve the existing Homes + agent surfaces unchanged.
- Produce a documented audit + phased plan (`/docs/rentals-getaways/`).

This document is the "current state" half of the audit. It is read-only
analysis — no code was changed.

---

## 2. Navigation architecture

There are **two independent sources of nav truth**, plus a store-side merge, plus
an i18n dictionary. All four must stay consistent.

### 2.1 Source A — `components/southline/Header.tsx` (`DEFAULT_NAV`)

Used when no CMS `navigation` settings exist. Current items (in order):

| key | href | EN label | ES label |
| --- | --- | --- | --- |
| `navHome` | `/` | (via `t`) Home | Inicio |
| `navHomes` | `/homes` | Homes | Casas |
| `navIdeas` | `/#categories` | (via `t`) Ideas | Ideas |
| `navRealEstate` | `/#real-estate` | (via `t`) Real Estate | Bienes Raíces |
| `navProjects` | `/planner` | (via `t`) Projects | Proyectos |
| `navDIY` | `/diy` | (via `t`) DIY | DIY |
| `navPros` | `/#professionals` | (via `t`) Professionals | Profesionales |
| `navBook` | `/book` | (via `t`) Book | Reservar |
| `navForContractors` | `/for-contractors` | (via `t`) For contractors | Para contratistas |

Note: `navHomes` carries inline `labelEs`/`labelEn`; every other item resolves
its label through `t(key, lang)` against `UI_DEFS`. There is **no `navHomes`
key** in `UI_DEFS`.

### 2.2 Source B — `lib/southline-types.ts` (`defaultSouthlineSettings().navigation`)

The CMS default persisted/merged on every settings read. Current items:

`navHome, navHomes, navIdeas, navRealEstate, navProjects, navDIY, navPros,
navBook` (8 items — note `navForContractors` is **absent** here).

### 2.3 Store merge — `lib/southline-store-json.ts` + `lib/southline-store-pg.ts`

Both merge stored nav against current code defaults **by `key`** on every read:

```
orderedFromDefaults = defaults.items.map((item) => storedByKey.get(item.key) ?? item)
customExtras       = stored items whose key is not in defaults
navigation.items   = [...orderedFromDefaults, ...customExtras]
```

Consequences that matter for this slice:

- A new nav key (e.g. `navRentals`) will **appear automatically** after a
  default update, even for tenants with stored settings.
- A **renamed** key (e.g. `navRealEstate` → `navRentals`) will not be merged —
  the old stored `navRealEstate` item survives as a `customExtra` and the new
  default appears too. Operators who saved nav settings will see a duplicate
  until they re-save, and old DB- or JSON-stored `navRealEstate` entries persist.
- Migrating stored settings (JSON file + Postgres `southline_settings` rows) is
  therefore part of the navigation work, not optional.

### 2.4 i18n — `lib/southline-i18n.ts` (`UI_DEFS`)

Current nav keys in the dictionary:

```
navHome / navIdeas / navProjects / navDIY / navPros / navBook / navForContractors
navAgents        (ES "Agentes", EN "Agents")
navRealEstate    (ES "Bienes Raíces", EN "Real Estate")
```

Missing entirely: `navHomes`, `navRentals`, `navGetaways`. `t()` is
`(key: UIKey, lang) => UI_DEFS[key][lang]`; `UIKey` is derived from `UI_DEFS`
via `keyof typeof`.

### 2.5 Homepage anchors

- `RealEstateEntryBlock.tsx` renders `<section id="real-estate">` (the
  `/#real-estate` target of `navRealEstate`) and contains `/homes` + `/agents`
  CTAs, the featured property card, and the recruitment callout.
- `FeaturedHomes.tsx` renders the "Featured Homes" grid with a `viewAllHomes`
  CTA → `/homes`.
- `Hero.tsx` has `heroRealEstateLink` copy in `UI_DEFS` but no nav dependency.

---

## 3. Property model

### 3.1 Type layer — `lib/real-estate/types.ts`

`Property` (one flat shape for sale + rental):

```ts
PropertyStatus = "draft" | "coming_soon" | "active" | "pending" | "sold" | "rental" | "archived"
Property { id, tenantId, organizationId, brokerageId, agentId, title, slug,
           status, published, address..., city/state/postalCode/country,
           price, bedrooms, bathrooms, squareFeet, lotSize?, propertyType,
           yearBuilt?, ..., description, shortDescription, features, amenities,
           showingInstructions?, openHouseDates[], imageUrls[], viewCount,
           qrScanCount, createdAt, updatedAt, deletedAt? }
```

- `"rental"` exists in the `PropertyStatus` union — but is **never used
  anywhere** (no fixture, no CMS path, no filter, no public UI).
- `price` is a single number (sale price). There is **no rent field**, no
  nightly rate, no deposit, no minimum-stay, no pet policy, no check-in/out, no
  availability — the model has zero rental-specific semantics.
- `propertyType` is a free string (e.g. "Single-family home", "Townhome").
- Listing purpose (sale vs long-term vs short-term getaway) is **not modeled**.

### 3.2 Persistence — `lib/db/schema.ts` `realEstateProperties` (line 376)

One table, mirror of the type minus `openHouseDates`/`showingInstructions`
(those live only in fixtures/types today):

```
id, tenant_id, organization_id, brokerage_id, listing_agent_id,
title, slug, property_type, property_status (text, default "draft"),
address_line_1, address_line_2, city, state, postal_code, country,
price_cents (integer), bedrooms (real), bathrooms (real), square_feet (integer),
lot_size, year_built, short_description, description,
amenities (jsonb[]), features (jsonb[]), hero_image,
published_at, is_published (bool), created_at, updated_at, deleted_at
```

- `property_status` is **plain text** — `"rental"` is valid by convention only,
  never validated at the DB level.
- Media is normalized into `realEstatePropertyMedia` (`media_type` image /
  floor_plan / video / virtual_tour, `is_hero`, `sort_order`) + a denormalized
  `hero_image` on the property row.
- Schema-drift guard (`tests/schema-drift.test.mjs`) proves source schema == live
  DB as of this date; no property columns are missing.

### 3.3 Repositories — `lib/real-estate/repositories.ts`

- `propertyRepository` (create/update/archive/publish/unpublish/delete, tenant
  scoped, `listProperties`, `listPublishedProperties`, `findBySlug/ById`,
  `listByTenant`). `listPublishedProperties` filters only on tenant +
  `isPublished` + not-deleted (+ optional `status`/`search`).
- `propertyMediaRepository` (list/add/reorder/replace/remove, hero promotion).
- Both are Postgres-backed via a lazily-created drizzle `Pool` (read-only
  drift check shares this file's `db()`).

### 3.4 Fallback fixtures — `lib/real-estate/fixtures.ts` + `homes-fallback.ts`

- `demoTenant` (`re-demo-tenant`, Southline Realty Group) + `demoAgents`,
  `demoBrokerage`, `demoProperties` (3 properties: `active`, `coming_soon`,
  `pending`), `demoLeads`, `demoAppointments`, `formatPropertyPrice()`.
- `homes-fallback.ts` wraps the repo: when a tenant's DB returns zero published
  properties and the tenant is `demoTenant`, it substitutes demo fixtures.
  **No rental-status fixture exists** → a rentals landing with fixture fallback
  needs new fixtures or a shared curated fallback.

### 3.5 CMS — `app/real-estate/properties/*`

Full CRUD under the protected CRM (`properties/page.tsx`, `new/page.tsx`,
`[id]/edit/page.tsx`, media endpoints under `/api/real-estate/properties/...`).
The form is a **sale-property form** — no rental fields.

---

## 4. Public routes inventory

| Route | File | Role |
| --- | --- | --- |
| `/homes` | `app/homes/page.tsx` | Published-property grid, search (`q`), pagination; inline EN/ES copy; `listPublishedPropertiesWithFallback(demoTenant.id, ...)`; `Metadata` EN-only; Lucio mounted. |
| `/homes/[slug]` | `app/homes/[slug]/page.tsx` | Property detail; `generateMetadata` w/ OG + images; contact agent + request showing via **`mailto:`** links only. |
| `/agents` | `app/agents/page.tsx` | Directory of published/featured `agentProfileStore` profiles → `/agents/[slug]`. |
| `/agents/[slug]` | `app/agents/[slug]/page.tsx` | Public agent profile (agent-profiles system). |
| `/agents/get-started` | (recruitment) | "Create/claim profile" flow referenced by the entry block. |
| `/book` | `app/book/page.tsx` + `BookingFlow.tsx` | Consultation booking; submits to **`/api/contractor/leads`** (SnapLink contractor lead), not the real-estate CRM. |
| `/results` | `app/results/page.tsx` | **Professionals-only** search results (contractors + agents). Properties are not in site search. |
| `/p/[username]` | `app/p/[username]/page.tsx` | SnapLink professional public page (protected working tree). |

### 4.1 Inquiry / lead flow (as-built)

- Public property page → `mailto:` (no persistence, no CRM lead).
- Public booking → `/api/contractor/leads` (contractor lead pipeline).
- Agent contact on profiles → `agent-profiles` events (`view`, `contact_click`,
  `booking_start`, etc.), separate from real-estate CRM.
- Real-estate CRM leads (`real_estate_leads`, `/api/real-estate/crm/leads`,
  `/real-estate/leads`, showings/open-houses/calendar/appointments) are all
  **internal-only** and not reachable from any public property page today.

---

## 5. Internal CRM inventory

`app/real-estate/*` (~60 routes) is wrapped by `ProtectedRealEstate` +
`ProfessionalShell` (`layout.tsx`). Highlights: `properties/*`, `leads/*`,
`buyers`, `sellers`, `calendar`, `showings`, `open-houses`, `transactions/*`,
`brokerages/*`, `agents/*`, `communications/*`, `campaigns`, `automation`,
`analytics/*`, `reports/*`, `ai/*`, `portal`, `qr-codes`, `enterprise`,
`marketplace`, `oauth`, `settings/*`, `tasks`, `notifications`, `documents/*`,
`inspections/*`. Backed by a very large `real_estate_*` schema in
`lib/db/schema.ts` (132 tables total, incl. agent_profiles).

There is **no public `/real-estate` route** — `/real-estate` resolves only to the
protected CRM landing. The old public anchor `/#real-estate` on the homepage is
the only public "real estate" entry point.

---

## 6. Search behavior

- `lib/southline-search.ts` searches contractors + listed agent profiles only.
  No `Property` matching; no `/homes` or `/rentals` surfaced in `/results`.
- `lib/southline-local-discovery.ts` (lines ~378–395) is the one exception: the
  `real-estate` category routes to **`/homes`** (not `/results`). A rentals
  surface is not represented in Local Discovery today.

---

## 7. Gaps relevant to "Rentals & Getaways"

1. **No rental semantics in the model** — no listing purpose, no rent/nightly
   price, no minimum stay, deposit, pet policy, check-in/out, availability.
2. **`"rental"` status is dead code** — in the TS union only; no fixtures, CMS,
   filter, or UI consume it.
3. **Single sale-property CMS form** — creating a rental today requires the same
   form and shows a sale price.
4. **Nav renames don't self-heal** — stored settings keep old `navRealEstate`
   entries (JSON + Postgres) and would show duplicates; migration is required.
5. **Existing tests encode the old nav** — `tests/real-estate-entry-block.test.mjs`
   asserts `navRealEstate` sits between Ideas and Projects and that Header links
   to `/#real-estate`; both must be updated in the testing phase.
6. **No public inquiry capture for properties** — `mailto:` only; rentals landing
   should reuse the same pattern or the CRM lead API.
7. **Search + Local Discovery don't know about rentals** — `/results` is
   professionals-only; Local Discovery routes `real-estate` → `/homes`.

---

## 8. Prior analysis

`docs/southline-living-complete-audit/16-real-estate-reality-check.md` concluded
the real-estate layer is an **operations-first platform** (CRM/workflows) rather
than a turnkey public marketplace. The Rentals & Getaways slice keeps that split:
the consumer public surface moves to image-driven `/homes` + `/rentals` landing
pages, while the operational CRM stays internal behind `/real-estate`.

---

## 9. Current → target nav mapping (proposed)

| Key | Current href/label | Target href/label |
| --- | --- | --- |
| `navHomes` | `/homes` · Homes/Casas | unchanged |
| `navRealEstate` → **`navRentals`** | `/#real-estate` · Real Estate/Bienes Raíces | `/rentals` · Rentals & Getaways / Alquileres y Escapadas |
| order | ... Ideas, Real Estate, Projects ... | ... Homes, **Rentals & Getaways**, Ideas, Projects ... |

Everything else (`navHome, navIdeas, navProjects, navDIY, navPros, navBook`) keeps
its current href; labels for the target order are specified in the slice brief.
`navForContractors` appears only in `Header.tsx` DEFAULT_NAV (not in CMS
defaults) — disposition documented in the navigation analysis doc (02).
