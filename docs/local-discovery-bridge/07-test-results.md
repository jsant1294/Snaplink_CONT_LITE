# Test Results

## Targeted Local Discovery Bridge suite

`tests/southline-cms-local-discovery.test.mjs` — **43/43 passing**
(`node --test tests/southline-cms-local-discovery.test.mjs`).

Covers all Phase 12 scenarios:

| # | Scenario | Test(s) |
|---|---|---|
| 1 | Master toggle hides the feature | `LocalDiscovery hides when disabled, ...`; `computeLocalDiscoveryStatus: master toggle hides the feature regardless of subordinate toggles` |
| 2 | Child toggles cannot override the master | `computeLocalDiscoveryStatus: child toggles cannot elevate status above hidden when master is off`; `LocalDiscoveryEditor visually disables the homepage/category-card toggles when the master switch is off, without resetting their values` |
| 3 | Valid ZIP generates the expected URL | `buildSnaplinkLocalUrl forwards ZIP, category, and default attribution`; `buildSnaplinkLocalUrl honors configurable route and parameter names` |
| 4 | Invalid ZIP is rejected | `US ZIP validation accepts 5-digit, ZIP+4, and normalizes whitespace` |
| 5 | Category mapping works | `LocalDiscovery omits unmapped categories from the outbound URL and logs a configuration warning instead of guessing a slug` |
| 6 | Locale is preserved | `buildSnaplinkLocalUrl resolves the English and Spanish routes`; `buildSnaplinkLocalUrl appends an optional locale query parameter without dropping the path-based locale` |
| 7 | Source and placement are included | `buildSnaplinkLocalUrl includes source and placement when attribution is enabled...`; `...omits source and placement when attribution is disabled` |
| 8 | UTM values preserved when enabled | `buildSnaplinkLocalUrl matches the Nextdoor attribution example`; `readApprovedUtmParams returns only allowlisted keys` |
| 9 | Unsafe destination URLs rejected | `validateSouthlineSettings rejects a directoryBaseUrl host that is not on the SnapLink allowlist`; `buildSnaplinkLocalUrl falls back to the default destination when the configured host is not allowlisted` |
| 10 | Missing mapping does not crash | `buildSnaplinkLocalUrl omits the category filter entirely when no category is supplied (missing mapping never crashes)` |
| 11 | English renders | `LocalDiscovery hides when disabled, renders localized copy, respects visibility + deterministic order, and never leaks the ZIP` |
| 12 | Spanish renders | (same test — asserts both `en`/`es` copy paths) |
| 13 | Mobile layout works | `LocalDiscoveryEditor renders EN/ES desktop/mobile previews and a Test Bridge tool...` |
| 14 | Featured professional opens canonical profile | Out of this bridge's scope — already covered by `tests/agent-profiles.test.mjs` / `tests/agent-management.test.mjs` (`/p/{username}` canonical route), unrelated to Local Discovery's SnapLink hand-off. |
| 15 | Attribution is recorded | `LocalSearchEventPayload records source, placement, locale, category, timestamp, session id, and UTM — analytics failures never block navigation`; `getOrCreateLocalDiscoverySessionId never throws...` |
| 16 | Analytics failure does not block redirect | Covered in the same attribution test (asserts the `try { onSearch?.(payload); ... }` guard and the "never block navigation" comment/contract) |
| 17 | Existing settings remain backward-compatible | `mergeLocalDiscoveryContent backfills every new SnapLink Local Bridge field with a safe default for settings saved before this bridge existed` |

Plus additional coverage for the status enum, host allowlist, fallback-path
safety, CMS bridge-config fields, category CRUD, and diagnostics panel
contents.

## Full project verification

- `npx tsc --noEmit -p tsconfig.json` — **0 errors**.
- `npm run build` — **succeeds** (Next.js production build completes,
  including `/southline/admin` and all existing routes).
- `node --test tests/*.test.mjs` (whole repo) — **327/333 passing**. The
  remaining 6 failures are a single pre-existing, unrelated test
  (`"Lucio Financial Copilot (tax/payment) code is untouched by this pass"`,
  duplicated across 6 test files) that diffs contractor tax/payment routes
  against a fixed historical commit (`3552ded`). Confirmed via `git log` that
  those routes diverged from that commit due to two later, already-merged
  feature commits (`Add Lucio Financial Copilot tax arm...` and
  `feat(contractor): website/gallery, landing page generator...`) — this
  predates the Local Discovery Bridge work and `git status --short` confirms
  none of those tax/payment files are touched by this pass.

## Fixes made during verification

- A full-file rewrite of `LocalDiscoveryEditor.tsx` had left a duplicate,
  stale tail fragment of the original `Toggle` function past the new one's
  closing brace — removed.
- Similarly, `lib/southline-local-discovery.ts` had a stray leftover
  `}\n\n  return url.toString();\n}` fragment after the new
  `getOrCreateLocalDiscoverySessionId()` function — removed.
- `runTestBridge()` referenced the outer `content` state directly; TypeScript
  cannot narrow a nullable variable captured by a nested closure across the
  component's earlier `if (!content) return` guard, so an explicit
  `if (!content) return;` guard was added at the top of `runTestBridge()`.
- `southline-validation.ts` needed a real (non-type-only) import of
  `isAllowedSnaplinkHost`/`isSafeFallbackPath` from
  `southline-local-discovery.ts`. Extensionless relative imports between
  `.ts` lib files are not resolvable by Node's native TypeScript stripping
  loader (used by `node --test` in this repo), so the import uses an
  explicit `.ts` extension; `tsconfig.json` gained
  `"allowImportingTsExtensions": true` (valid alongside `noEmit: true`) so
  `tsc` accepts it too.
