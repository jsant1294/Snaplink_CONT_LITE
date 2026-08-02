# 10 — Migration Decision

Status: Phase 11 — complete.

## Decision: no DB migration

This slice ships **no database migration**. The shared taxonomy is a pure-code registry
that derives from the existing canonical arrays (`SERVICE_CATEGORIES`,
`SERVICE_LIBRARY`, `PROFESSION_TYPES`, `LICENSED_PROFESSION_TYPES`).

## Why no migration is required

| Requirement | Satisfied by |
|-------------|--------------|
| Shared catalog across dashboards + Southline | Code registry `lib/home-service-taxonomy.ts`, imported everywhere |
| Preserve stored lead values | Leads keep storing `SERVICE_LIBRARY` EN names; registry preserves them 1:1 |
| Preserve `/results?category=` and Local Discovery routing | No schema or URL change; `resolveCategoryId` is additive |
| Bilingual labels + aliases | Code constants, same as the existing `SERVICE_CATEGORIES` pattern |
| No second identity table | Nothing persisted; no `professional_profiles` (test 32) |
| No new route family | No pages added (test 33) |

Existing tables are untouched: `contractors`, `agent_profiles`, and every other schema
object remain exactly as committed. `tests/schema-drift.test.mjs` still passes.

## Destructive-migration guard

No drop/rename/alter is applied anywhere. All existing category and service ids are
preserved byte-for-byte.

## When a migration WOULD be justified (future only)

- Runtime editing of taxonomy content by operators (full CMS CRUD — see
  `09-cms-readiness.md`) would need a persistence table plus a seed of the code registry
  as default rows. That is a forward-looking, additive change and must be its own
  approved slice.
- If a future split ever needs to re-home `roof_exterior`'s exterior services into a new
  `exterior` category, stored lead values would need a careful, auditable backfill — not
  an automatic migration.
