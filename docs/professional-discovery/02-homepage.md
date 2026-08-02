# 02 — Homepage Home Services cards

Status: done (Phase 3).

## Before
`FeaturedServicesEntryBlock` rendered its category strip from `PROFESSION_TYPES` (18
hardcoded profession ids) and pointed every chip at `/#professionals` — a dead anchor.

## After
The strip is taxonomy-driven:

```ts
const serviceCategories = listSouthlineHomeServices({ locale: lang });
```

- Deterministic ordering (group `sortOrder`, then category `sortOrder`).
- Locale-resolved labels; no duplicates; inactive categories excluded.
- Every chip now links to the real directory filter: `/results?category=<id>`.
- The image-dominant featured card is untouched: it stays CMS-driven
  (`settings.homeServices` + `featuredContractorId`, `DEMO_FEATURED_PROFESSIONAL`
  fallback) — no redesign, no reordering of sections, no loss of CMS selections.

## Untouched
- `CategoriesGrid` (ideas `SouthlineCategory[]` from CMS) — separate ideas content,
  not the home-service taxonomy.
- `FeaturedProfessionals` placement/order on the homepage.
