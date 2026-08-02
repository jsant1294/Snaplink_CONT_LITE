# 01 — Canonical Source & Ownership

Status: Phase 3 — decision.

## Decision: no new DB table, no new identity

The shared taxonomy is a **pure-code registry** (`lib/home-service-taxonomy.ts`) that
**derives** from the existing canonical arrays. Nothing is persisted, nothing is
renamed, and no migration is required (see `10-migration-decision.md`).

| Value | Canonical source (owner) | Derived registry exposes |
|-------|---------------------------|--------------------------|
| Service categories (10) | `lib/services.ts` `SERVICE_CATEGORIES` (Contractor) | `HOME_SERVICE_CATEGORIES` (same id/labels, + group/audience/aliases) |
| Services / specialties (59) | `lib/services.ts` `SERVICE_LIBRARY` (Contractor) | `HOME_SERVICE_SPECIALTIES` (id = EN name, + aliases) |
| Top-level groups (22) | New — this slice | `HOME_SERVICE_GROUPS` |
| Profession taxonomy (18 trades + 6 licensed) | `lib/profession-types.ts` (Contractor + Agent) | `professionCategoryId()` bridge |
| Local Discovery legacy slugs | `lib/southline-local-discovery.ts` (Southline) | `LOCAL_DISCOVERY_LEGACY_MAP` (documentation + resolution fallback) |

## Rules

1. **Stable ids.** Every category/specialty id is a slug. Renaming is a breaking
   change: leads store `SERVICE_LIBRARY` EN names and `/results?category=` is a URL
   param. New ids only; never rename.
2. **Additive only.** The registry adds structure (`parentId`, `audience`, `aliases`,
   `sortOrder`, flags) on top of canonical values; it never rewrites them.
3. **Professions map 1:1 to categories.** Every value in `PROFESSION_TYPES` and
   `LICENSED_PROFESSION_TYPES` resolves through `professionCategoryId()` to an existing
   category (guarded by tests 07/08).
4. **Audience is metadata, not routing.** `audience` documents the provider surface
   that primarily serves a category. It never redirects a dashboard or merges
   identities.
5. **Southline consumes both audiences.** `listSouthlineHomeServices` mixes
   contractor + professional categories by default; callers opt into a subset.

## Ownership matrix

- **Contractor dashboard** owns service names, categories, question sets → edits go
  through `lib/services.ts` / `lib/questions.ts`; the registry picks them up by
  derivation.
- **Agent (professional) side** owns `profession_type`, `categories[]`, `specialties[]`
  on `agent_profiles` → edited through the agent management flow.
- **Southline** owns public discovery surfaces (`/results`, ideas, Local Discovery,
  homepage blocks) and the search adapter. It must not edit the contractor catalog.
- **This registry** owns only structure (groups, audience, aliases, bridge) and is
  read-only for the dashboards.

## How a new category gets added

1. Add it to the canonical owner (`SERVICE_CATEGORIES` for a contractor trade, or the
   professional category list for an agent-facing one).
2. If it is a profession, extend `PROFESSION_CATEGORY_MAP` so `professionCategoryId`
   covers it (test 07/08 enforces coverage).
3. Optionally add aliases. The registry derivation does the rest.
