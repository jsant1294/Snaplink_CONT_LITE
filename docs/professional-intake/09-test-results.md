# Test Results

## New: `tests/professional-intake.test.mjs`

**40/40 passing.** Real behavioral tests importing the engine directly (`questions.ts`, `normalize.ts`, `profile-map.ts`, `generate-copy.ts`, `apply.ts`) with real taxonomy/profession-type data — not only source-regex assertions, though a handful of items (store persistence shape, route-level auth wiring, migration additivity) are source-assertion by necessity since they describe file/route structure rather than pure-function behavior.

Maps to the spec's 36-item checklist 1:1 for items 1–30; items 32–36 ("existing X tests remain green") are verified by running those suites directly (below), not duplicated inside this file. Item 31 ("existing SnapLink intake tests remain green") is asserted as "not applicable, confirmed by audit" since the source repo has zero intake tests (`00-snaplink-intake-audit.md`).

## Regression suites run

| Suite | Result |
|---|---|
| `npm run test:professional-intake` (new) | **40/40 passing** |
| `npm run test:agent-management` | 23/23 passing |
| `npm run test:unified-professional` | 51/51 passing |
| `npm run test:professional-catalog` | 40/40 passing |
| `npm run test:taxonomy` | 51/51 passing |
| `npm run test:southline-search` | 17/17 passing |
| `npm run test:contractor-modules` | 1 pre-existing failure (see below), rest passing |
| `npm run test:schema-drift` | **1 expected failure — see below** |

### `test:schema-drift` — expected, not a regression

This suite connects to the **live Postgres database** (`DATABASE_URL` is configured in this environment) and asserts every table in `lib/db/schema.ts` already exists there. Since this task's migration (`drizzle/0023_professional_intake_sessions.sql`) was deliberately **generated but not applied** — per the explicit instruction to stop and report before running `db:push` — the live database does not yet have `professional_intake_sessions`, so this one assertion correctly fails right now. It will pass the moment the migration is applied; this is not a bug in the intake feature.

### `contractor-landing-page.test.mjs` — pre-existing, unrelated

"every profession type has a landing template" fails for `photographer`. Confirmed unrelated: `lib/landing-templates.ts` was never touched by this task, and this same failure was already observed and documented in this session's prior professional-catalog work — a different concurrent session's in-progress "photographer" profession-type addition, still missing its landing template.

## Type check and build

- `npx tsc --noEmit` — **0 errors** (full repo).
- `npm run build` — **succeeds**, `/southline/admin/intake/[ownerType]/[ownerId]` present in the route list, no new warnings/errors introduced. Verified via a temporary isolated `distDir` (to avoid disturbing the running dev server), then reverted; `next.config.ts` and `tsconfig.json` confirmed to exactly match their pre-build state afterward.
