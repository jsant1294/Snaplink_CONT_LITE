# Category Pages

Two "browse by category" surfaces exist on Southline Living, serving different purposes. Neither
gained a new route this pass — both are the existing routes, improved.

## `/results?category=X` — the primary browsing surface

Already the strongest surface on the site before this pass (see
[00-public-profile-audit.md](./00-public-profile-audit.md) "what's already good") — responsive
grid, a real empty state, a working pill filter bar, and it already used `ProfessionalCard`. The
only change here was fixing the hardcoded `lang === "es" ? "Buscar" : "Search"` search button to
use the existing `t("heroSearch", lang)` key (`app/results/page.tsx`).

## `/ideas/[category]` — homeowner inspiration + relevant professionals

This page had a real, meaningful bug: **its "Professionals" section showed the same six
contractors on every category page, completely unfiltered.** `/ideas/cocinas` (Kitchens) and
`/ideas/garajes` (Garages) rendered an identical list — actively misleading given the section is
headed by a category-specific title.

### The fix

`/ideas/[category]` uses its own homeowner-facing category slugs (`cocinas`, `banos`, `patios`,
...) — a different taxonomy than the contractor service-vertical categories
(`lib/services.ts` `SERVICE_CATEGORIES`: `remodeling`, `plumbing`, `outdoor`, ...). Rather than
inventing a new taxonomy or redesigning either one (explicitly out of scope — "No taxonomy
redesign" was a stated boundary for this pass), a small bridge map was added:

```ts
const CATEGORY_TO_SERVICE_CATEGORIES: Record<string, string[]> = {
  cocinas: ["remodeling"],
  banos: ["remodeling", "plumbing"],
  patios: ["outdoor", "concrete"],
  // ...
};
```

Contractors are then filtered using the **existing, already-tested**
`categoryIdsForContractor()` helper (`lib/southline-search.ts` — the same function `/results`'
search already relies on for its own category filtering), intersected against the bridge map's
target categories. No new filtering logic was written from scratch; this reuses what already
works correctly elsewhere.

A test (`tests/marketplace-polish.test.mjs`, "every ideas category-to-service-category mapping
only references real SERVICE_CATEGORIES ids") guards the bridge map itself against ever
referencing a category id that doesn't actually exist in `lib/services.ts`.

### Also fixed on this page

- **Real empty state**: if a category genuinely has no matching contractors,
  `t("noProfessionalsYet", lang)` renders instead of an empty grid under a heading (previously:
  the heading rendered with nothing underneath it, or — before the filtering fix — the same six
  unrelated contractors).
- **Card upgrade**: contractor cards went from a bare text link (business name + tagline + "View
  Profile →", no photo, no badge) to a photo (with the same `professionPlaceholderPhotoFor`
  fallback used elsewhere) + profession badge, matching the visual language established by
  `ProfessionalCard`.
- **Back-to-all-services navigation**: a `t("browseAllServices", lang)` link to `/results` was
  added at the bottom of the professionals section — previously the only way out of a category
  page was the single "Home" breadcrumb.

## What's still out of scope here

Full category-page parity with `/results` (search, multi-category filter pills) was not
attempted — `/ideas/[category]` is a content/inspiration page with a professionals section
attached, not a search interface, and turning it into one is a larger product decision, not a
polish-pass fix.
