# 07 — Test Results

Status: Phase 12 — complete.

## Type-check & build

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | ✅ exit 0 |
| `npm run build` | ✅ succeeds (`/results` compiles) |

## New acceptance tests — `tests/home-service-taxonomy.test.mjs`

34 tests (the 28 named items plus 6 boundary guards), all pass:

| # | Item |
|---|------|
| 01 | Registry preserves all 10 `SERVICE_CATEGORIES` ids/labels |
| 02 | Registry preserves all 59 `SERVICE_LIBRARY` specialties |
| 03 | Every category has a valid parent group |
| 04 | Every category is bilingual |
| 05 | Every category has a valid audience tag + unique id |
| 06 | Every category exposes an alias list |
| 07 | Every trade profession maps to an existing category |
| 08 | Every licensed profession maps to an existing category |
| 09 | `resolveCategoryId` resolves canonical ids |
| 10 | `resolveCategoryId` resolves bilingual labels |
| 11 | `resolveCategoryId` resolves aliases (`techador`, `fotógrafo`) |
| 12 | `resolveCategoryId` resolves Local Discovery legacy slugs (canonical wins) |
| 13 | `resolveCategoryId` returns `undefined` for unknown input |
| 14 | Search finds a contractor by `techador` |
| 15 | Search finds a contractor by `roofer` |
| 16 | Search finds a contractor by `canaletas` |
| 17 | Search finds an agent by `fotógrafo` |
| 18 | Search matches by group label (EN + ES) |
| 19 | Search matches an agent by `Bienes Raíces` |
| 20 | Category filter resolves aliases (`techos`) |
| 21 | Unknown category filter → empty result set |
| 22 | Category filter matches an agent by `photography` |
| 23 | Alias expansion never duplicates results |
| 24 | Canonical service-name search still works |
| 25 | `categoryIdsForContractor` unchanged for the fixture |
| 26 | `categoryIdsForAgent` keeps mappings + adds profession category |
| 27 | `categoryIdsForAgent` derives photographer → `photography` |
| 28 | `listSouthlineHomeServices` returns both audiences + locale label |
| 29 | Adapter filters by audience |
| 30 | Adapter filters by parent group + search |
| 31 | Adapter orders by group then sortOrder |
| 32 | Taxonomy is pure data (no DB/migration/identity table) |
| 33 | No new route family (`/professionals`, `/taxonomy` absent) |
| 34 | No new DB migration landed in `drizzle/` |

## Regression suites

| Suite | Result |
|-------|--------|
| `test:taxonomy` (taxonomy + southline-search) | ✅ 51/51 |
| `test:unified-professional` | ✅ 51/51 |
| `test:schema-drift` | ✅ 2/2 |
| `test:southline` | ⚠️ 75/81 — 6 pre-existing failures (below) |
| Local Discovery + CMS suites (`southline-local-routing`, `southline-cms-local-discovery`) | ✅ 91/91 (with search + unified) |

## Pre-existing failures (proven, not caused by this slice)

`test:southline` reports **6 failures**, all the same test name:
**"Lucio Financial Copilot (tax/payment) code is untouched by this pass"** in
`featured-services`, `lucio`, `master-refactor-v2`, `master-refactor-v3`,
`snaplink-platform`, and `southline-form-visibility` test files.

- **Cause:** each runs `git diff --name-only <baseline> -- app/api/contractor/expenses …`
  against a baseline commit that predates `51be33f` (Money module) and `a2879f5`, which
  added the `app/api/contractor/expenses|forms-1099|payees|quarterly|setasides|tax-profile`
  routes. Those files are therefore "changed" relative to the stale baselines.
- **Proof:** with this slice's changes stashed (`git stash push -u`), the same test
  fails identically.
- **Impact on this slice:** none — this slice touches only `lib/southline-search.ts`,
  adds `lib/home-service-taxonomy.ts` and `tests/home-service-taxonomy.test.mjs`, and
  never modifies tax/payment code.
