# 06 — Local Discovery Compatibility

Status: Phase 9 — verified, no refactor.

## Rule: Local Discovery logic is untouched

`lib/southline-local-discovery.ts` (`getCategoryDestination`, `getInternalCategorySlug`,
`buildDiscoveryTarget`, allowed hosts, UTM copy) is **not modified** by this slice. Its
`internalSlug` values remain authoritative for routing Southline-owned cards to
`/results?category=…`.

Existing routing tests stay green (`tests/southline-local-routing.test.mjs`,
`tests/southline-cms-local-discovery.test.mjs`):

- `builders-remodelers` → `category=remodeling`
- `landscaping` → `category=outdoor`
- `photography` → SnapLink destination (external)
- `admin` → throws
- missing destination → Southline (no silent SnapLink open)

## Relationship to the taxonomy

- `LOCAL_DISCOVERY_LEGACY_MAP` in the taxonomy **documents** the same values and is the
  resolution fallback for `resolveCategoryId()` when an input is not already a canonical
  category id.
- Canonical ids win in `resolveCategoryId()` when they collide with a legacy slug
  (`pools` → `pools`, not `outdoor`). Local Discovery's own routing for the `pools` card
  is unaffected and still returns `outdoor`. Both behaviors are tested
  (test 12 in `tests/home-service-taxonomy.test.mjs`, and the Local Discovery suites).

## Compatibility guarantees

1. No URL/query contract changes: `/results?category=` accepts the same values as before
   and now *additionally* accepts labels/aliases.
2. No ownership change: every `destination` decision is still made solely by
   `getCategoryDestination`.
3. No new external routing: unknown categories never route anywhere (no-guess rule).
