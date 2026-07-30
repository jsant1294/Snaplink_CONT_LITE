# Southline Living — Implementation Plan

## Repository Audit (Baseline)

### Current Architecture

**Stack**: Next.js 15.5.20 (App Router) · TypeScript 5 · React 19 · Tailwind CSS 3.4  
**Database**: PostgreSQL via Neon (production) / JSON files in `.data/` (local dev) — switched via DATABASE_URL  
**ORM**: Drizzle ORM 0.45  
**Auth**: PIN-based (env OPERATOR_PIN + per-contractor 6-digit PINs). No middleware.ts — protected at component level via PinGate wrapper.  
**i18n**: Custom bilingual module (`lib/i18n.ts`) with EN/ES for all surfaces. Canonical data stored in English.  
**Storage**: Vercel Blob (optional) for photos/receipts/W-9s  
**AI**: OpenRouter API (free-tier-only enforced) for lead intelligence + receipt OCR  
**PDF**: pdf-lib for estimate/proposal/invoice/year-end PDFs  
**SMS**: Twilio (optional)  
**Fonts**: Cormorant Garamond (display), Inter (body) — via Google Fonts  
**Design**: Dark theme (obsidian/charcoal/gold/bone) with card shadows and gold accents

### Route Map

| Route | Type | Auth | Purpose |
|---|---|---|---|
| `/` | Public | None | Currently: contractor directory listing + links to admin/dashboard. **Target: Southline Living consumer homepage** |
| `/contractor/[username]` | Public | None | Per-contractor public intake page with service grid, contact buttons, intake wizard |
| `/contractor-admin` | Protected | PIN gate | Operator master console — all contractors, lead board, PIN reset |
| `/contractor-admin/[username]` | Protected | PIN gate | Per-contractor dashboard (lead board, AI, PDFs) |
| `/contractor-admin/[username]/money` | Protected | PIN gate | Lucio Financial Copilot (expenses, 1099s, quarterly, tax settings) |
| `/contractor-admin/estimate/[leadId]` | Protected | PIN gate | Estimate builder per lead |
| `/contractor-admin/new-contractor` | Protected | PIN gate | Create new contractor account |
| `/pitch` | Public | None | Redirect to `/pitch.html` (static marketing page) |

### API Routes (all under `/api/contractor/`)

27 route files covering: auth, profiles, leads, AI summaries, estimates, estimate/proposal/invoice PDFs, payments, QR codes, expenses, expense categories, money summary, tax profile, payees, 1099 forms, set-asides, quarterly, receipt OCR, year-end PDF/CSV.

### Database Schema (10 tables, Drizzle)

- **contractors** — business profiles with services (jsonb), PIN, language pref
- **leads** — client project requests linked to contractors
- **photos** — lead photos (data URL or Blob URL)
- **estimates** — line items (jsonb), tax/discount/deposit
- **tax_profiles** — per-contractor tax settings
- **expense_categories** — system + custom categories
- **expenses** — expense records (integer cents, soft-delete)
- **payees** — subcontractors (only last 4 of TIN stored)
- **forms_1099_received** — 1099s contractor receives
- **tax_setasides** — tax money set aside records

### Auth System

- **3 levels**: Operator (master PIN), Contractor (per-tenant PIN), Public (no login)
- PIN via `x-snaplink-pin` header or `?pin=` query param
- Session stored in `sessionStorage`
- No `middleware.ts` — protection is component-level via `PinGate`

### Test Coverage

**No test files exist** in the repository. Zero automated tests. README references manual verification only.

### Lint/Typecheck Status

No ESLint config exists. `next lint` enters interactive setup mode. We will not introduce a linter config change without explicit instruction.

### Pre-existing Risks

1. No automated tests — cannot run a pre-change test suite
2. No ESLint config — lint command is interactive, not usable in CI
3. No middleware.ts — route protection is client-side at the component level
4. `usePg` check runs at module import time — importing store modules logs warnings if no DATABASE_URL
5. JSON fallback is explicitly not for production (ephemeral filesystem in serverless)

---

## Reuse Map

| Requirement | Existing Module | Reuse Strategy | Changes Needed |
|---|---|---|---|
| Authentication | `lib/auth.ts` + `PinGate` in `Dashboard.tsx` | Full reuse | None — keep current system |
| Contractor profiles | `lib/store-json.ts` / `lib/store-pg.ts` + `lib/types.ts` | Reuse | New consumer-facing card/detail components |
| Services/categories | `lib/services.ts` (45+ services, 10 categories) | Reuse | Category display for inspiration |
| i18n | `lib/i18n.ts` (EN/ES for all surfaces) | Extend | Add Southline Living strings (new file or extend existing) |
| Estimator | `components/admin/Estimator.tsx` + `lib/estimate-library.ts` | Reuse | Consumer Project Planner in Phase 3 wraps existing engine |
| Leads | `lib/store-json.ts` `leadStore` + API routes | Reuse | New booking flow creates leads through existing API |
| Contractor data | `contractorStore.list()` / `getByUsername()` | Reuse | Featured professionals read from existing store |
| Media | Vercel Blob (optional) + `lib/ai/receipt-ocr.ts` | Reuse | Content images use same pipeline |
| Payment display | `lib/payments.ts`, `lib/types.ts` `PaymentMethods` | Reuse | Show payment methods on pro profiles |
| Design tokens | `tailwind.config.ts` (obsidian, gold, etc.) | Extend | Add warmer/editorial tokens for consumer surfaces |
| Fonts | Cormorant Garamond + Inter | Reuse | Same fonts, different sizing for editorial feel |
| Admin dashboard | `components/admin/Dashboard.tsx` | Extend | Phase 2 — add Southline Living CMS section |
| Notifications | `lib/notify.ts` (Twilio) | Reuse | Phase 4 — booking notifications |

### New Modules Required

| Module | Purpose | Phase |
|---|---|---|
| `lib/southline-i18n.ts` | Spanish-first i18n for consumer content | 1 |
| `components/southline/Header.tsx` | Consumer header with nav + lang toggle | 1 |
| `components/southline/Hero.tsx` | Hero section | 1 |
| `components/southline/CategoriesGrid.tsx` | Inspiration category cards | 1 |
| `components/southline/FeaturedProfessionals.tsx` | Featured contractor cards | 1 |
| `components/southline/EditorialSection.tsx` | Trending/editorial content area | 1 |
| `components/southline/Footer.tsx` | Consumer footer | 1 |
| Admin CMS components | Southline Living management UI | 2 |
| Consumer Project Planner | Wraps existing estimator | 3 |
| Consumer Booking flow | Creates leads via existing API | 4 |
| Contractor Recruitment | Join/claim flows | 5 |
| DIY Hub | Interactive project guides | 6 |

---

## Routing Change Plan

| Current | New | Notes |
|---|---|---|
| `/` = contractor directory + admin links | `/` = Southline Living consumer homepage | All existing routes preserved |
| `/contractor/[username]` | Unchanged | Consumer intake still works |
| `/contractor-admin/*` | Unchanged | Full PIN protection preserved |
| `/api/contractor/*` | Unchanged | All APIs preserved |
| _New_ | `/southline/admin` (Phase 2) | Southline Living CMS |

---

## Phase 1 Implementation (Consumer Homepage)

### Design Direction

The Southline Living consumer layer should feel editorial, warm, and premium — distinct from the dark contractor dashboard. We extend the existing design system with:
- Same font family but lighter weights, larger sizes
- Warm neutral backgrounds (cream, warm white) instead of dark obsidian
- Same gold accent color for branding continuity
- Card-based layouts with generous spacing
- Rounded corners, subtle shadows
- Spanish-first throughout

### Component Architecture

```
app/
  layout.tsx          ← Updated: Southline metadata, lang detection, fonts
  page.tsx            ← Rewritten: Southline Living homepage (server component)

components/
  southline/
    Header.tsx        ← Nav, logo, lang toggle, contractor login link
    Hero.tsx          ← Hero banner with search
    CategoriesGrid.tsx  ← Inspiration category cards
    FeaturedProfessionals.tsx  ← Contractor cards from existing store
    EditorialSection.tsx  ← Trending/seasonal content
    Footer.tsx        ← Full consumer footer

lib/
  southline-i18n.ts   ← Spanish-first consumer strings
```

### Data Flow
- Homepage is a **server component** that calls `contractorStore.list()` to get featured professionals
- Categories are defined in the i18n module (static content)
- Language preference stored in a cookie (`southline_lang`)
- Language detection: cookie > browser Accept-Language > default `es`

---

---

## Phase 2 — Admin CMS (Complete)

### Goals
- Add PIN-protected Southline Living CMS within the existing auth system
- Allow editing homepage hero copy, section visibility, featured contractors, and feature flags
- Persist settings via JSON store (following existing pattern); API route for CRUD
- Add CMS navigation link in operator console

### Files Created/Changed

| File | Action | Purpose |
|---|---|---|
| `lib/southline-types.ts` | **Created** | CMS data types: HeroContent, SectionVisibility, SouthlineSettings, defaults |
| `lib/southline-store-json.ts` | **Created** | JSON file store for Southline settings (`.data/southline-settings.json`) |
| `lib/southline-store.ts` | **Created** | Store driver switch (JSON for now, PG-ready) |
| `app/api/southline/settings/route.ts` | **Created** | GET/PATCH API route (PIN-gated with operator PIN) |
| `components/southline/admin/HomepageEditor.tsx` | **Created** | Hero copy + section visibility editor |
| `components/southline/admin/FeaturedProsPicker.tsx` | **Created** | Checkbox picker for featured contractors |
| `components/southline/admin/FeatureFlagPanel.tsx` | **Created** | On/off toggles for feature flags |
| `app/southline/admin/page.tsx` | **Created** | PIN-gated CMS admin page with tab navigation |
| `app/contractor-admin/page.tsx` | **Updated** | Added "Southline Living CMS →" link in operator console |
| `app/page.tsx` | **Updated** | Reads CMS settings; passes hero, sections, featured IDs, nav items to components |
| `components/southline/Header.tsx` | **Updated** | Accepts navItems from CMS; falls back to defaults |
| `components/southline/Hero.tsx` | **Updated** | Accepts hero content from CMS; falls back to i18n defaults |

### CMS Capabilities

1. **Homepage Builder** — Edit all hero copy (title, subtitle, search prompt, 3 CTAs) in both ES/EN; toggle section visibility
2. **Featured Professionals** — Select which contractors appear in the featured section (checkboxes from existing contractor records)
3. **Feature Flags** — On/off switches: southline_homepage, consumer_booking, project_planner, diy_hub, diy_premium, contractor_recruitment, claim_business, community_spotlight

### Architecture Decisions

- New route `/southline/admin` operates within the same PIN-gate auth as `/contractor-admin`
- Settings API uses `x-snaplink-pin` header — same pattern as all existing protected routes
- Data stored in `.data/southline-settings.json` (same JSON directory as other stores)
- Feature flags have safe defaults (all non-Phase-1 features default to false)
- Homepage reads settings from store on every request (force-dynamic) — no caching layer needed yet
- Settings are validated by TypeScript types; no runtime validation needed for MVP

### Build Verification
- ✅ Full `next build` — compiled, no type errors
- ✅ 28 pages compiled (homepage, 4 contractor-admin, 1 contractor public, 1 southline admin, 1 not-found)
- ✅ 28 API routes (27 original + `/api/southline/settings`)
- ✅ All existing routes preserved

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| No test suite to verify regressions | Manual verification of all existing routes after change |
| `usePg` check on module import | Homepage server component imports contractorStore at runtime — safe |
| `.env.local` has DATABASE_URL set | Dev mode uses Postgres. JSON fallback available if unset |
| Existing contractor/admin routes must work | All routing preserved; only `/` changes |
| No middleware for route protection | Adding middleware could break existing PIN flow. Preserve component-level PIN gate |
| Spanish-first may affect existing EN-first routes | Consumer routes get new i18n module; existing EN/ES system unchanged |
