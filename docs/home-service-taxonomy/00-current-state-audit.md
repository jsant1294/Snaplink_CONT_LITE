# 00 — Current-State Audit: Home-Service Taxonomy Surfaces

Status: Phase 1 (audit) — complete. No code changed during this phase.

## 1. Inventory of every taxonomy surface

| # | Surface | File | Ids / labels | Role | Owner |
|---|---------|------|--------------|------|-------|
| 1 | Service categories | `lib/services.ts` → `SERVICE_CATEGORIES` | 10 ids, EN/ES labels | Contractor service groups; canonical category set | Contractor |
| 2 | Service library | `lib/services.ts` → `SERVICE_LIBRARY` | 59 `ServiceDef` (name EN, es, category, questionSet) | Canonical value stored on leads = EN name | Contractor |
| 3 | Question sets | `lib/questions.ts` → `QUESTION_SET_MAP` | 16 sets | Lead intake questionnaire per service | Contractor |
| 4 | Trade professions | `lib/profession-types.ts` → `PROFESSION_TYPES` | 18 trades, EN/ES | `contractors.profession_type` values | Contractor |
| 5 | Licensed professions | `lib/profession-types.ts` → `LICENSED_PROFESSION_TYPES` | 6 licensed, EN/ES | `agent_profiles.profession_type` values | Agent |
| 6 | Southline ideas cards | `lib/southline-types.ts` → `DEFAULT_CATEGORIES` (31 `SouthlineCategory`) | id + title/cta/desc EN/ES + image | Ideas/directory cards, not services | Southline CMS |
| 7 | Home services content | `lib/southline-types.ts` → `HomeServicesContent` / `DEFAULT_HOME_SERVICES` | i18n content, default `{}` | Homepage "Home Services" block content | Southline CMS |
| 8 | Local Discovery categories | `lib/southline-types.ts` → `DEFAULT_LOCAL_DISCOVERY_CATEGORIES` | 8 cards (id, internalSlug, destination) | Homepage local-discovery entry points | Southline CMS |
| 9 | Local Discovery routing | `lib/southline-local-discovery.ts` | `getInternalCategorySlug`, `destination` | Routes Southline cards to `/results?category=…` or SnapLink | Southline |
| 10 | Unified search | `lib/southline-search.ts` | category filter + query matching | `/results` + `/api/southline/search` | Southline |
| 11 | Contractor validation | `app/api/contractor/profiles/route.ts` → `VALID_SERVICE_NAMES` | Set of 59 EN names | Server-side service validation | Contractor |
| 12 | Real-estate property types | `lib/real-estate/validation.ts` → `PROPERTY_TYPES` | 7 | Real-estate listings (not home services) | Real estate |
| 13 | Expense categories | `scripts/seed-categories.mjs` | 16 | Financial categories (not home services) | Contractor bookkeeping |
| 14 | Featured fixture | `lib/featured-services-fixtures.ts` → `DEMO_FEATURED_PROFESSIONAL` | 1 demo | Homepage demo (not taxonomy) | Southline |
| 15 | Demo seeds | `scripts/seed-demos.mjs`, `scripts/seed-demo-ridgeline.mjs` | `SERVICE_LIBRARY` EN names | Seed contractor rows | Contractor |
| 16 | Agent freeform fields | `lib/agent-profiles/types.ts` | `categories[]`, `specialties[]` (free text) | Agent listing metadata | Agent |

## 2. Verified counts (cross-checked by executing the modules)

- Service categories: **10** (`remodeling, paint_drywall, flooring, roof_exterior, plumbing, electrical, hvac, outdoor, concrete, handyman`).
- Services: **59** (the repo does **not** have 151; see §4 Q1).
- Question sets: **16**.
- Profession types: **18** trades + **6** licensed = **24**.
- Local Discovery default categories: **8** (ids → internalSlug below).
- Southline ideas cards: **31** `SouthlineCategory` entries.
- Registry counts (Phase 2 build): **22 groups, 21 categories, 59 specialties**.

Local Discovery default `internalSlug` values (verified at runtime):

```
builders-remodelers -> remodeling      architects -> remodeling
interior-designers  -> remodeling      landscaping -> outdoor
roofing             -> roof_exterior   pools       -> outdoor
photography         -> photography     real-estate -> real-estate
```

## 3. Two identity systems (unchanged)

- **Contractor identity**: `contractors` table, `/contractor/{username}`, contractor dashboard.
- **Agent identity**: `agent_profiles` table, `/agents/{slug}`, agent management dashboard.

They stay separate (hard boundary). The taxonomy is a **catalog**, not an identity model.

## 4. Answers to the 15 audit questions

1. **Where are home-service categories defined today?** 1 system of record: `SERVICE_CATEGORIES` (10) + `SERVICE_LIBRARY` (59) in `lib/services.ts`. Southline ideas cards and Local Discovery cards are separate CMS lists that map onto these.
2. **What are the category ids?** `remodeling, paint_drywall, flooring, roof_exterior, plumbing, electrical, hvac, outdoor, concrete, handyman` (contractor), plus 11 professional categories introduced in Phase 2.
3. **Is any category shared between the contractor and professional sides today?** Only indirectly: `southline-search.ts` matches agents whose free-text categories/specialties equal a `SERVICE_CATEGORIES` label/id/service name. No shared catalog exists.
4. **Is there a second identity system?** Yes — two separate profile tables (contractors + agent_profiles). Neither must be merged. No `professional_profiles` exists and none is being created.
5. **Are there two dashboards?** Yes. They stay separate.
6. **What is the canonical value stored on leads?** `SERVICE_LIBRARY[].name` (EN). Server-side validation uses `VALID_SERVICE_NAMES` derived from it.
7. **Is there a DB taxonomy table?** No. Categories are code constants. Expense/seed tables are unrelated.
8. **Are there duplicate or conflicting lists?** Ideas cards and Local Discovery cards are display lists, not duplicates of the service catalog; they reference it. No conflicting service lists.
9. **Is the 151-service number real?** No — the repo has exactly **59** services (`docs/handoffs/BIG_PICKLE_TAKEOVER_AUDIT.md` confirmed this; 151 matched only a hex color and a photo id).
10. **Which surfaces must preserve ids/behavior?** `/results?category=`, `/api/southline/search`, Local Discovery `internalSlug` routing, lead-stored service names, `profession_type` validation.
11. **Which labels are bilingual?** `SERVICE_CATEGORIES`, `SERVICE_LIBRARY` (`es`), `PROFESSION_TYPES`/`LICENSED_PROFESSION_TYPES` (EN/ES).
12. **What is missing for a shared catalog?** Top-level groups, an audience tag, aliases, and a profession→category bridge. Added in Phase 2 without changing any stored value.
13. **Do contractors and agents share a category filter today?** Yes at runtime in `southline-search.ts`, via loose label/id/service matching; not via a shared catalog.
14. **Can the homepage "Home Services" block consume a shared catalog?** Yes — `HomeServicesContent` is content today; `listSouthlineHomeServices` (Phase 5) can feed it.
15. **Ownership summary:** contractor catalog = `lib/services.ts`; profession taxonomy = `lib/profession-types.ts`; Southline CMS lists = `lib/southline-types.ts`; routing = `lib/southline-local-discovery.ts` + `lib/southline-search.ts`. All preserved.

## 5. Conclusion

Audit supports Phase 2: build a **pure-code shared registry** on top of `SERVICE_CATEGORIES` / `SERVICE_LIBRARY` / profession types, add groups + audience + aliases + a profession bridge, and adapt `southline-search.ts` — with **no** DB migration, **no** route changes, and **no** dashboard or identity merge.
