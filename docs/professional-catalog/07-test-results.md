# 07 — Test Results

## New: `tests/professional-catalog.test.mjs`

**40/40 passing** (`npm run test:professional-catalog`). Covers the full 37-item checklist from
the recovery brief plus 3 extras (16 was split into three sub-tests — adapter-level dedup,
render-layer dedup, and validation-level dedup — since those are three independent code paths,
not one). Notably, most of these are **real behavioral tests** against real fixture data
(`makeContractor()`/`makeAgent()` built from actual `Contractor`/`AgentProfile` shapes and real
profession/service ids verified against `lib/profession-types.ts`/`lib/services.ts`), not source
regex — `lib/southline-professional-catalog.ts` is pure and store-free, so it can be imported
and exercised directly. Only the admin-panel and homepage-JSX-wiring checks (tests 23–28, 30–31,
which need a DOM to truly execute) fall back to source assertion, consistent with this
repository's established testing convention for client components.

All 40 passed on the first real run against the fixed code — a meaningful signal that the
defects found in Phase 1 (below) were the only real gaps, not symptoms of a deeper problem.

## Defects found and fixed during this recovery pass

1. **`ProfessionalCatalogPanel.tsx`** — a contractor row's "Open →" action pointed at the exact
   same URL as "Copy" (`/contractor/{username}`, the public page) instead of the operator
   workspace (`/contractor-admin/{username}`), unlike the agent row's correct
   `/southline/admin/agents/{id}`. Fixed, and a genuine "Preview" action (opens the real public
   URL in a new tab) was added — the panel previously had no way to actually *view* the live
   public profile in one click, only copy its URL or open a redundant duplicate link.
2. **`FeaturedProfessionals.tsx`** — contractor cards on the homepage showed a "Featured" badge
   on *every* card unconditionally; the agent half of the same component already correctly
   gated its badge on the curated `featuredAgentProfileIds` list. Fixed to gate on
   `featuredContractorIds.includes(c.id)`. Verified live against the running dev server with
   real seeded data (no contractors currently curated as featured → zero "Featured" badges
   render, where before the fix every card would have shown one).
3. **`FeaturedProfessionals.tsx`** — the local `orderByIds` render-ordering helper had no guard
   against a duplicate id appearing twice in a featured-id list, which would have rendered the
   same professional's card twice. Fixed with a `seen` id tracker.
4. **`lib/southline-validation.ts`** — `featuredContractorIds`/`featuredAgentProfileIds` were
   checked for "array of strings" but not for duplicate entries, meaning the exact input that
   triggers defect 3 above could be saved through the panel's own PATCH call. Fixed: a PATCH
   containing a duplicate id in either array is now rejected with a 400 before it's ever
   persisted.

No other defects were found. `catalogDiagnostics`, `cardComparator`
(featured-order/updatedAt/displayName), the publication gates, the fallback functions, and the
search/category delegation were all verified correct as originally written.

## Regression suites (all run this pass, not projected)

| Suite | Command | Result |
| --- | --- | --- |
| Taxonomy | `npm run test:taxonomy` | 51/51 |
| Professional discovery | `npm run test:professional-discovery` | 74/74 |
| Professional catalog | `npm run test:professional-catalog` | 40/40 |
| Unified professional | `npm run test:unified-professional` | 51/51 |
| Southline search | `npm run test:southline-search` | 17/17 |
| Schema drift | `npm run test:schema-drift` | 2/2 (includes a live, read-only DB comparison) |

## Full repository suite

`node --test tests/*.test.mjs` — **559/567 passing**. The 8 failures are pre-existing and
unrelated to this slice (all previously confirmed earlier in this session, re-verified here to
be certain none are new):

- 6× "Lucio Financial Copilot code is untouched by this pass" — a stale hardcoded git-diff base
  commit check (`3552ded`) in unrelated test files, flagging a real but separately-committed
  contractor billing/website feature from before this session. No Money or Lucio file was
  touched by this recovery pass.
- 1× `tests/agent-pg-review.test.mjs` — a pre-existing extensionless-import resolution quirk when
  run outside the project's special module loader, unrelated to the catalog.
- 1× "every profession type has a landing template" — a concurrent session's in-progress
  "photographer" profession-type addition missing its landing-page template, a file this pass
  never touched.

## Type check and build

`npx tsc --noEmit` — clean, both before and after the defect fixes.
`npm run build` — clean (verified with a temporary isolated `distDir`, reverted immediately
after, same discipline used throughout this repository's session history).

## Manual verification

- Homepage (`/`) hit directly against a running local dev server with real seeded data: the
  `id="professionals"` section renders real contractor cards (e.g. "JJ Remodeling"), and — this
  was the actual regression test for defect 2 — **no card shows a "Featured" badge**, correctly
  matching the fact that no contractor is currently in `featuredContractorIds`.
- `/southline/admin` returns `200`. The admin panel itself is client-rendered behind a PIN gate;
  no headless-browser tooling is installed in this environment (a limitation noted throughout
  this session's UI work), so the interactive feature/reorder/preview flow was verified via the
  source-level tests (23–28) plus manual code reading, not a live click-through.
