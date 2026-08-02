# 04 — Directory filters, aliases, and safe empty states

Status: done (Phase 5, verification).

The professional directory is `/results` (shared between trades and agents). Filtering
was already taxonomy-aligned from the prior slice (`lib/southline-search.ts`); this slice
verified and locked the behavior with tests:

- `searchProfessionals` resolves the `category` value through `resolveCategoryId`
  (canonical id → legacy slug → label/alias). Direct canonical id wins (e.g. `pools`
  resolves to the Pools & Spas category, not the legacy `outdoor` value).
- Unknown values produce an empty result — never a crash, never a guessed category.
- Both contractors (`categoryIdsForContractor`) and agents
  (`categoryIdsForAgent`) are filtered through the same taxonomy terms.

## Verified invariants
- `?category=roof_exterior`, `?category=roofing` (legacy slug), and `?category=Roofing`
  (label) all resolve to the same result set.
- `?category=real-estate` surfaces listed agents (realtor) only.
- Photography stays a SnapLink-owned category in Local Discovery (see 07).
- `/results` stays the internal Southline directory route — Local Discovery's
  `buildDiscoveryTarget`/`getCategoryDestination` ownership logic is untouched.
