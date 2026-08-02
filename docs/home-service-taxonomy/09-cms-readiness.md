# 09 — CMS Readiness

Status: Phase 10 — read-only view; full CRUD deferred.

## Today

The taxonomy is a **read-only code registry** (`lib/home-service-taxonomy.ts`). Southline
surfaces can consume it read-only via `listSouthlineHomeServices` and `resolveCategoryId`.
There is **no** CMS page that edits categories in this slice, and none is required for the
acceptance criteria.

## Read-only guarantees

- Registry values are derived from the canonical owner arrays; a CMS cannot drift them
  at runtime.
- No category id, label, or alias is persisted to the DB, so there is nothing to edit or
  migrate.
- The admin surfaces that DO exist (ideas cards, Local Discovery cards in
  `southline-types.ts` / CMS pages) are untouched and continue to store their own
  content lists.

## What full CRUD would require (deferred)

1. A persistence layer for overrides (a small table or JSON store keyed by category id),
   keeping the code registry as the seed/default — this is the one scenario that would
   justify a DB migration (see `10-migration-decision.md`).
2. Admin pages to edit: labels, aliases, audience, `featured`, `southlineVisible`,
   `sortOrder`, and per-category images/CTAs.
3. Validation so stored overrides always resolve back to a stable category id (no-guess
   rule preserved).
4. Bilingual edit UI mirroring the existing ideas/Local Discovery admin patterns.

## Recommendation

Ship CRUD only when there is a real operator editing taxonomy content. Until then the
read-only registry plus the content CMS covers every current surface.
