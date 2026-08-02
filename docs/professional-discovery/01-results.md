# 01 — Professional Directory (`/results`)

Status: done (Phase 2 + Phase 5).

## Before
The `/results` category chips were hardcoded from `SERVICE_CATEGORIES` (10 contractor
categories) — the same array the contractor dashboard uses, duplicated for public
display.

## After
Chips render from the shared taxonomy:

```ts
const categories = listSouthlineHomeServices({ locale: lang, audience: "both" });
```

- `audience: "both"` lists **every active category** (contractor + professional +
  both-tagged) with a single argument — see `SouthlineHomeServicesOptions`.
- Labels are locale-resolved at render time (`c.label`, `c.labelEn` / `c.labelEs`).
- Ids are the stable canonical slugs, so the `/results?category=<id>` URL contract is
  unchanged.
- Inactive categories are filtered out by the adapter.

## Directory filtering (Phase 5)
The directory filter still goes through `searchProfessionals` (`lib/southline-search.ts`),
which resolves the category value via `resolveCategoryId` — canonical id, legacy Local
Discovery slug, or bilingual label/alias. An **unresolved** value is kept as-is so it
filters to an empty result set — never a silent fallback to an unrelated category, never
a crash. The page renders the existing `resultsEmpty` / `searchNoResults` empty state.

## Contract
- `?q=…` and `?category=…` query params unchanged.
- Search overlay + hero form still submit to `/results`.
- Contractor dashboard surfaces (`contractor-admin`, Estimator, ProjectPlanner,
  BookingFlow) still use `SERVICE_CATEGORIES` — untouched, out of scope.
