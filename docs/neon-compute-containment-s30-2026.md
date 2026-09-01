# Neon Compute Containment Pass (S30 · 2026-09-01)

## Verdict
**SHIPPABLE.** Delivered the lowest-risk, highest-impact fixes from the prior compute audit:
SQL-side publish gates for public queries, a 5-minute homepage data cache, classified all
force-dynamic routes (correctly concluding removals yield zero compute benefit), and
tightened the dev pool. No DB driver migration, no production mutation, no TRUE GEO
semantics change, no onboarding/lifecycle behavior change.

## Scope guardrails — all held
- **No DB driver migration.** Still node-postgres `pg.Pool`; `@neondatabase/serverless` NOT adopted.
- **No `list()` semantics change.** `list()` untouched; new `listPublished()` / `listPublicActive()`
  are additive and used only at public call sites where filter semantics match exactly.
- **No production mutation.** Nothing writes to `ep-red-recipe-atgps8a1`; changes are code/test-only.
- **GEO + lifecycle behavior unchanged.** Results page keeps its zip/GEO path; publish gate enforced
  in SQL (`listPublished`) so cached results can never expose unpublished/demo pros.

## Phase results

### PHASE 1 — Public query filtering (SQL-side publish gate)
- `lib/store-pg.ts` / `lib/store-json.ts`: added `listPublished()` = `isDemo=false AND status="published"`.
- `lib/agent-profiles/store-pg.ts` / `lib/agent-profiles/store-json.ts`: added `listPublicActive()` =
  `status="active" AND isDemo=false AND southlineStatus IN ("published","featured")`.
- Migrated public call sites only: `app/page.tsx` (contractors), `app/sitemap.ts`, `app/book/page.tsx`,
  `app/planner/page.tsx`, `app/for-contractors/page.tsx`, `app/ideas/[category]/page.tsx`,
  `app/api/contractor/profiles/public/route.ts`, `app/api/southline/search/route.ts`, `app/results/page.tsx`,
  `app/agents/page.tsx`.
- **Deliberately NOT migrated (semantics differ or internal):** `app/api/contractor/profiles/route.ts` (admin
  `list()`), `app/api/agent-profiles/route.ts` (public branch keeps `listActive().filter(!isDemo)`),
  `app/api/agent-profiles/create|check/route.ts`, `lib/lucio/tools.ts:63,80`, homepage agents (`app/page.tsx:46`).
- New test: `tests/public-discovery-query.test.mjs` (SQL predicate source diff + pure-predicate equivalence).

### PHASE 2 — Homepage caching
- New `lib/public-cache.ts`: `unstable_cache` wrappers, `revalidate:300` for settings, published
  contractors, public agents, featured property, published homes, published rentals. SQL gate runs
  before cache → safety preserved even on cache hit.
- `app/page.tsx` consumes the cached getters; render order and imports reduced. JSX untouched.

### PHASE 3 — Force-dynamic audit (classification only, NO removals)
- **REQUIRED:** results, book, diy, diy/[slug], ideas/[category], contractor/[username], homes,
  homes/[slug], rentals, agents/[slug], f/[token], i/[token], p/[username].
- **UNCERTAIN (cookie-bound + DB/CMS settings):** agents, contact, faq, for-contractors, planner, snaplink.
- **UNNECESSARY but no-op if removed (cookie-bound):** how-it-works, agents/get-started.
- Every route reads `cookies()` (sl_lang) → already dynamic in Next 15; **removal yields zero compute
  reduction.** No removals made. (Deliberate non-change; avoids churn with no benefit.)

### PHASE 4 — Results page
- Migrated data access to `listPublished()` + `listPublicActive()` (SQL push-down avoids full scans);
  kept `searchProfessionals` as defense-in-depth; preserved GEO/zip behavior; no `revalidate` added.

### PHASE 5 — Dev pool config (`lib/db/connection.ts`)
- Set `max:5`, `idleTimeoutMillis:5000`, `connectionTimeoutMillis:5000`, `allowExitOnIdle:true`
  (tightened from pg 8.22 defaults 10 / 10000 / 0 / false). `npx tsc --noEmit` clean.

### PHASE 6 — Test DB isolation
- `tests/schema-drift.test.mjs` no longer reads `.env.local`'s `DATABASE_URL`. The live drift check now
  requires explicit `SCHEMA_TEST_DATABASE_URL` and **refuses to run against the everyday
  `DATABASE_URL`/`POSTGRES_URL`**; skips cleanly when absent. Static source check still always runs
  (coverage not silently lost). Result: plain `npm test` no longer wakes the primary dev Neon project.
- `tests/agent-pg-review.test.mjs` (guards to `review_0022_scratch` only) and
  `tests/real-estate-db-integration.test.mjs` (`REAL_ESTATE_TEST_DATABASE_URL`, skips if unset) verified safe.

### PHASE 7 — Build behavior
- `npx next build` completes successfully. All public page routes are `ƒ (Dynamic)` → no static-gen DB
  access. **Exception:** `/sitemap.xml` is `○ (Static)` and statically prerenders, so it executes its DB
  reads during build against the (dev) URL — **pre-existing behavior, not introduced by this pass.**

### PHASE 8 — Before/after measurement (qualitative)
| Vector | Before | After |
|---|---|---|
| Public catalog queries | full `list()` → filter in JS after full read | SQL push-down `listPublished()` / `listPublicActive()` |
| Homepage DB calls/request | uncached per-request reads | `unstable_cache` revalidate:300 (5 min) |
| Test isolation | schema-drift woke dev Neon on every `npm test` | isolated behind `SCHEMA_TEST_DATABASE_URL` |
| Pool idle/compute | max 10 / idle 10s / timeout 0 | max 5 / idle 5s / timeout 5s |

### PHASE 9 — Verification
- `npx tsc --noEmit`: clean (0 errors).
- Target suites (agent-profiles, agent-management, professional-intake): 0 failures.
- Full `node --test "tests/*.test.mjs"`: **784 tests, 762 pass, 14 fail, 8 skipped.**
  - 14 failures = exact pre-existing baseline (Lucio Financial Copilot untouched-guards ×4-7, V3
    homepage section-order, photographer LANDING_TEMPLATES, focus-visible/CTA styling, homes search
    color, agent-pg-review module-resolution env-load). **Zero new failures from this pass.**
  - Skipped went 7 → 8 (the now-isolated schema-drift live check).
- Build verified (Phase 7).

## Git
Committed only this pass's files: `app/{agents,book,for-contractors,ideas/[category],page,planner,results,sitemap}*`,
`app/api/contractor/profiles/public/route.ts`, `app/api/southline/search/route.ts`,
`lib/{store-pg,store-json,agent-profiles/store-pg,agent-profiles/store-json,db/connection,public-cache}.ts`,
and tests `public-discovery-query`, `contractor-lifecycle-publish-gate`, `demo-data-safety`,
`homepage-hierarchy-rentals`, `master-refactor-v3`, `schema-drift`. Pre-existing WIP left untouched.

## Remaining risks (accepted, out of scope)
- `/sitemap.xml` static prerender hits the DB at build time (pre-existing; would need `force-dynamic` or
  `revalidate` on the sitemap — separate decision).
- `allowExitOnIdle:true` is fine for serverless/dev but worth re-confirming if a long-running local server
  shows idle teardown; low risk for the dev singleton.
- Indexing of `isDemo`/`status` columns was not changed; SQL filters still use existing indices.
