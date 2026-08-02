# 06 — Test results

Status: done (Phase 8).

## New suite: `tests/professional-discovery.test.mjs` (28 tests)
Coverage mapped to acceptance criteria:

| # | Criterion | Tests |
|---|-----------|-------|
| Results chips | `audience:"both"` lists every active category of both audiences, no duplicates | 20 |
| Bilingual | same ids, locale-resolved labels (EN/ES) | 21 |
| URL contract | stable canonical ids, `resolveCategoryId(id) === id` | 22 |
| Audience narrowing | professional/contractor subsets | 23 |
| Source | `/results` reads taxonomy, no `SERVICE_CATEGORIES`, `c.label`, `category: c.id` | 24 |
| Deterministic ordering | stable across locales/calls, per-group sortOrder ascending | 25 |
| Homepage cards | `listSouthlineHomeServices`, links to `/results?category=`, no `PROFESSION_TYPES.map` | 30, 31 |
| Featured filtering | category/audience/professionType; unknown → empty; no filter → unchanged | 40–45 |
| Featured source | `filterProfessionalsByTaxonomy` wired into `FeaturedProfessionals` | 46 |
| Directory filters | canonical id / legacy slug / label all match; unknown → empty | 50 |
| Agent filtering | `searchProfessionals` resolves agents through taxonomy | 51 |
| Search compat | `categoryIdsForContractor/Agent` stay taxonomy-aligned | 52 |
| Local Discovery | photography→SnapLink, others→Southline; legacy slugs canonical | 60, 61 |
| Local Discovery source | component untouched (no taxonomy import) | 62 |
| CMS | `TaxonomyTab` read-only, `resolveCategoryId` warnings | 70 |
| Taxonomy compat | adapter output ⊆ registry | 71 |

## Updated suites
- `tests/southline-search.test.mjs` — `/results` source test now asserts
  `listSouthlineHomeServices` and the absence of `SERVICE_CATEGORIES`.
- `tests/featured-services.test.mjs` — category-strip test now asserts the taxonomy
  adapter and `/results?category=` links (was `PROFESSION_TYPES.map`).

## Runs
- `test:professional-discovery` (new script): **79/80 pass** — 1 failure is the known
  pre-existing **Lucio Financial Copilot untouched** test (`featured-services` stale
  `e407245` baseline; no money files changed by this slice).
- Related suites (unified-professional, master-refactor v2/v3, real-estate-entry-block,
  snaplink-platform, southline-cross-promo, lucio, southline-form-visibility,
  rentals-getaways, southline-local-routing, southline-cms-local-discovery,
  agent-profiles, agent-management): **only the 6 known pre-existing LFC failures**.
- `npx tsc --noEmit`: **exit 0**.
- `npm run build`: **clean**.
