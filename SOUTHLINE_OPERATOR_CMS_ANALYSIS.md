# Southline Living Operator CMS — Analysis Report

> Audit pass only. No files were modified, no migrations created, nothing committed.

## Objective

There is already an admin area for landing-page content. Before building anything new, the existing implementation was inspected to determine whether it can be extended for Southline Living — without creating a second CMS, new admin shell, or parallel content system.

**Headline finding:** the repo already has a dedicated **Southline Living CMS** (built in a prior Phase 2 iteration) at `/southline/admin`, plus a large operator CRM shell. The Southline CMS *is* the landing-page admin. The shell, auth, data model, and publishing flow are all safe to extend; the gaps are capability gaps, not architecture mismatches. **Recommendation: Option A — Extend Existing Admin.**

---

## 1. Existing Admin — What Already Exists

### Routes

| Route | Purpose | Auth |
|---|---|---|
| `/southline/admin` | Southline Living CMS (`app/southline/admin/page.tsx`) | `PinGate` → operator PIN |
| `/contractor-admin` | Operator master console; links to the CMS (`app/contractor-admin/page.tsx:60-63`) | `PinGate` |
| `/api/southline/settings` | `GET` / `PATCH` settings (`app/api/southline/settings/route.ts`) | `x-snaplink-pin` header |
| `/api/southline/diy` + `/api/southline/diy/[id]` | DIY CRUD (`POST`/`GET`, `PUT`/`DELETE`) | PIN |
| `/api/southline/{search,recruitment,newsletter}` | Public-facing data routes | public |
| `/api/real-estate/*` | CRM APIs (properties, agents, plans, billing, branding…) | PIN + tenant + member headers |
| `/api/agent-profiles/*` | Agent profile activation/suspend | PIN + tenant |
| `/app/real-estate/*` (27 sections) | Operator CRM shell — **pure CRM, no content editor** | `ProtectedRealEstate` |
| `/api/lucio/{chat,events}` | **Uncommitted, in-flight** Lucio AI chat widget | public / anonymous |

### CMS Admin Panels (`components/southline/admin/`)

- `HomepageEditor` — hero ES/EN copy + 13 section visibility toggles
- `FeaturedProsPicker` — featured contractors
- `FeatureFlagPanel` — 8 feature flags
- `RecruitmentLeadsViewer` — recruitment leads
- `AgentProfilesPanel` — activate/suspend agent profiles, tier + billing plan
- `RealEstateBlockEditor` — featured property, featured agents, ES/EN copy, visibility
- `DiyEditor` — ES/EN title/desc, difficulty, category, slug
- `SpotlightEditor` — ES/EN items **with image URL + link URL**

### Models & Tables

- **Southline content model**: `SouthlineSettings` in `lib/southline-types.ts:59-81` — `hero`, `sections` (flat boolean map), `featuredContractorIds`, `featuredAgentProfileIds`, `realEstateBlock`, `featureFlags`, `seo`, `navigation`, `spotlight`, `updatedAt`.
- **Persistence**: `.data/southline-settings.json` via `lib/southline-store-json.ts` — **write-through**, merges against code defaults on every read (protects against silent field loss). DIY projects in `.data/diy-projects.json`. **No Postgres table exists for homepage content** (`southline-store.ts:4` — "PG store can be added when needed").
- **Postgres tables** (`lib/db/schema.ts`, 80+ tables): contractors/leads/estimates, the full real-estate CRM, `agent_profiles`, and new `lucio_events` (uncommitted migration `0014`). Nothing stores website content.

### Permissions & Auth

Single mechanism everywhere: 6-digit operator PIN (`lib/auth.ts`, env `OPERATOR_PIN`, default `777777`) via `x-snaplink-pin` header or `?pin=`. The real-estate shell adds tenant (`x-real-estate-tenant`, demo tenant only) + member headers with 6 roles / ~36 permissions (`lib/real-estate/permissions.ts`). The **CMS itself is operator-PIN only** — no role split for content ops.

### Content Flow (current)

```
/southline/admin (PinGate) → panel form
  → PATCH /api/southline/settings  (PIN-checked)
  → .data/southline-settings.json (write-through, no draft)
  → app/page.tsx (force-dynamic) reads store per request
  → components render: CMS value > i18n t() fallback > hardcoded
```

### Answers to the 10 "Determine" Questions

1. **Editable homepage sections**: hero copy, real-estate entry block (copy + featured property/agents), featured-professional selection, spotlight items, DIY projects, nav items, feature flags, section on/off. That is all.
2. **Fields supported**: ES/EN text fields, booleans, ID lists, URL strings (Spotlight / DIY only).
3. **English and Spanish**: Yes — dual-field convention throughout (`*Es`/`*En`), plus the `t()` dictionary (`lib/southline-i18n.ts`).
4. **Images changeable**: Only Spotlight (`imageUrl`) and DIY (`coverImage`) accept image URLs. **All other images are hardcoded Unsplash URLs** — Hero (`Hero.tsx:5`), Categories (`CategoriesGrid.tsx:21-139`), Trending (`TrendingSection.tsx:8-20`), Seasonal (`SeasonalIdeasBanner.tsx:6`), Estimator/Booking (`EstimatorBookingSection.tsx:4-5`), Featured-Services demo fixture. No upload pipeline exists for CMS content.
5. **Sections hidden**: Yes — 13 toggles in `SectionVisibility`.
6. **Sections reordered**: No. Flat boolean map; order is hardcoded JSX in `app/page.tsx:75-105`.
7. **Publish immediately**: Yes — every save writes through to the live file instantly. No explicit "publish" action.
8. **Draft/preview**: No, nowhere in the Southline path. (Real-estate properties have `isPublished` but no preview/scheduler.)
9. **Seasonal scheduling**: No. `SeasonalIdeasBanner.tsx:4-5` explicitly notes "no seasonal-content data model exists yet". RE campaigns have `startsAt/endsAt` but are email/SMS outreach only, no UI, and are not wired to the homepage.
10. **Safe for Southline?**: The shell is safe and appropriate; the gaps are capability gaps, not architecture mismatches.

### Localization, Media, Publishing (summary)

- **Localization**: custom dictionary `UI_DEFS` + `t()` (`lib/southline-i18n.ts:434`); some inline bilingual strings bypass the dictionary (e.g. `Footer.tsx:62`, `CommunitySpotlight.tsx:19-28`).
- **Media**: Vercel Blob upload exists only in real-estate (property media, agent photos, brokerage logos) and contractor photos — nothing feeds homepage content.
- **Publishing**: instant write-through; `settings.seo` exists in the model **but is never consumed** — `app/layout.tsx:10-19` hardcodes metadata.

---

## 2. Gap Analysis

| Requirement | Status | Notes |
|---|---|---|
| Hero editing | **Already supported** | Copy ES/EN; **hero image missing** |
| Find a Home section | Partially supported | `RealEstateBlockEditor` handles copy + featured property/agents; section chrome is i18n/hardcoded |
| Home Services section | **Missing** | i18n copy + hardcoded demo fixture (`lib/featured-services-fixtures.ts`) |
| Browse Categories | **Missing** | Hardcoded `DEFAULT_CATEGORIES`; `categories` prop exists but never passed (`app/page.tsx:91`) |
| Featured Professionals | **Already supported** | `FeaturedProsPicker`; card chrome hardcoded |
| SnapLink Story | **Missing** | `PoweredBySnapLink` + `lib/snaplink-content.ts` hardcoded |
| DIY Learning | Already supported | `DiyEditor`; no draft/status; URL-only images |
| Trending Projects | **Missing** | Hardcoded `TRENDING_CARDS` |
| Seasonal Ideas | **Missing** | i18n + hardcoded image, no data model |
| Cost Estimator | Partially supported | Visibility toggle only; copy hardcoded i18n |
| Book Consultation | Partially supported | Visibility toggle only; copy hardcoded i18n |
| Become a Professional | Partially supported | Visibility toggle only; copy hardcoded i18n |
| FAQ | **Missing** | Hardcoded seed in `lib/faq.ts` (has `published` flag in code, no editor) |
| Lucio starter prompts | **Missing** | Hardcoded `lucioPrompt*` keys (`southline-i18n.ts:364-381`) + fixed `PROMPT_KEYS` (`GuidedPrompts.tsx:3-10`) |
| Footer promotional content | **Missing** | Footer is 100% i18n |
| English and Spanish | Already supported | Dual-field everywhere; default-lang mismatch noted below |
| Image replacement | Partially supported | Only Spotlight/DIY via URL; no upload for CMS |
| Section visibility | **Already supported** | 13 toggles |
| Section ordering | **Missing** | — |
| Featured listing selection | **Already supported** | `featuredPropertyId` dropdown |
| Featured agent selection | **Already supported** | `featuredAgentProfileIds` |
| Featured professional selection | **Already supported** | `featuredContractorIds` |
| Draft | **Missing** | — |
| Preview | **Missing** | — |
| Publish | Present but unsuitable | Instant write-through; no explicit publish action |
| Scheduling | **Missing** | — |
| Version history | **Missing** | — |
| Rollback | **Missing** | — |

---

## 3. Reusable Parts (reuse, don't rebuild)

- **Auth**: `PinGate` + `lib/auth.ts` operator PIN (`isOperator`, `pinFromRequest`).
- **Shell**: `/southline/admin` tab layout + styling.
- **API contract**: `GET` / `PATCH /api/southline/settings`; DIY CRUD routes.
- **Store**: `southline-store-json.ts` (defaults-merge-on-read pattern) + `southlineStore` seam — a PG store can be dropped in behind the same interface.
- **Types**: `SouthlineSettings` / `HeroContent` / `SectionVisibility` — extend, don't fork.
- **i18n**: `t()` + `UI_DEFS`; Lucio strings already added (uncommitted).
- **Content fixtures**: `lib/faq.ts` seed (with `published` / `lastReviewed`), `lib/southline-diy.ts` seed.
- **Media**: Vercel Blob upload pattern from `app/api/real-estate/uploads/route.ts` and the property-media route — reuse the pattern for CMS images.
- **Lucio plumbing**: `lib/lucio/*` tools already read through the existing stores (`tools.ts`) — keep.

---

## 4. Risks

- **Duplicate data**: two sources already exist for hero copy (i18n defaults vs. CMS values) and for SEO (`settings.seo` unused vs. hardcoded `layout.tsx`). New editors must pick one source per field or drift returns.
- **Public rendering**: write-through JSON means a bad save instantly breaks the live homepage; `.data/` is ephemeral on serverless (documented in the implementation plan). Draft/preview would need a parallel "preview" file or store refactor.
- **Auth**: CMS is operator-PIN only — no role separation for content ops (RE has a `marketing_coordinator` role, unused for content). PIN travels via header, no session, no expiry.
- **Translation**: mixed origins (dictionary / inline bilingual / CMS) — third-source risk as editors are added; also `page.tsx`/`layout.tsx` default lang is `"en"` while `HomepageEditor.tsx:122` claims Spanish is the default consumer language.
- **Migration**: moving settings JSON → Postgres later must keep the defaults-merge behavior or it will silently drop new fields (a bug class the code comments explicitly call out).
- **Preview/publishing**: none exists today; adding it is the largest structural change (store + API + render path all touch it).
- **In-flight work**: Lucio (AI SDK deps, `lucio_events` migration `0014`, schema/i18n diffs) is uncommitted on this branch — any CMS work should not conflict with it.

---

## 5. Recommendation — Option A: Extend Existing Admin

The existing system **already is** a landing-page CMS for Southline (`/southline/admin` + settings API + JSON store + PIN auth + ES/EN). It can safely absorb the missing capabilities by extending the existing `SouthlineSettings` shape and panels — no new CMS framework, no second admin shell, no new tables required for the first slices. Option D is not warranted.

### Smallest safe implementation sequence

- **Slice 1 — Close visible gaps cheaply**: consume `settings.seo` in `app/layout.tsx` metadata; add hero background image + section-copy fields (Home Services, Seasonal, Trending) to the existing settings JSON/editor; pass the `categories` prop to `CategoriesGrid`; reuse the Vercel Blob pattern for CMS image upload. Non-destructive; touches only additive fields + the existing store.
- **Slice 2 — Seasonal scheduling**: add a `seasonal` object to `SouthlineSettings` (active / season / start / end) and override `sections.seasonalIdeas`; later reuse the RE campaign scheduling pattern if needed.
- **Slice 3 — FAQ + Lucio controls**: add an FAQ editor and Lucio prompt editor backed by the same settings JSON store (seed from `lib/faq.ts`), keeping Lucio tools reading through the same data.
- **Slice 4 — Draft / preview / publish + version history / rollback**: snapshot-based (JSON history files or a small PG table via the existing `southlineStore` seam), preview file read by `app/page.tsx?preview=1`, explicit publish action.
