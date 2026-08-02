# Test Results

## New: `tests/professional-intake-payment.test.mjs`

**43/43 passing.** Covers all 37 checklist items 1:1 plus 6 extra structural checks (operator-only auth on all four new routes, the generic-agent-route gate closure, content-approval persistence in both stores, contractor's honest "no second status system" response, and no-secrets-exposed).

## Regression suites run

| Suite | Result |
|---|---|
| `npm run test:professional-intake-payment` (new) | **43/43 passing** |
| `npm run test:professional-intake` (prior task) | 40/40 passing — unaffected |
| `node --test tests/agent-tier-entitlements.test.mjs` | 29/29 passing — tier bundle logic untouched |
| `npm run test:professional-catalog` | 40/40 passing — catalog adapter untouched |
| `npm run test:contractor-modules` | 1 pre-existing failure (below), rest passing |
| `npm run test:schema-drift` | **1 expected failure — see below** |

### `test:schema-drift` — expected, not a regression

Same situation as the prior professional-intake task: this suite connects to the live Postgres database and asserts every `lib/db/schema.ts` table/column already exists there. Migrations `0023` (professional intake sessions, from the prior task) through `0025` (this task's content-approval columns) have deliberately not been applied — `professional_intake_sessions` still shows as "missing from the live DB." This resolves the moment `npm run db:push` is run.

### `contractor-landing-page.test.mjs` — pre-existing, unrelated

"every profession type has a landing template" fails for `photographer` — the same pre-existing, already-documented gap from a different concurrent session's in-progress work (first observed in the professional-catalog task, still unresolved, `lib/landing-templates.ts` untouched by this task).

## Type check and build

- `npx tsc --noEmit` — 0 errors in project source (a handful of `.next/types/**` entries reference stale cached type-check artifacts from the live dev server picking up newly-added route files mid-session; these are build-output cache staleness, not source errors, and resolve on the dev server's next request).
- `npm run build` — verified via the same isolated-`distDir` procedure used throughout this session.
