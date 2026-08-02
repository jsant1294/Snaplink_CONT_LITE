# 03 — Featured Professionals filtering

Status: done (Phase 4).

`FeaturedProfessionals` (homepage contractors grid) now accepts an optional taxonomy
filter and applies it before rendering:

```ts
import {
  filterProfessionalsByTaxonomy,
  type ProfessionalTaxonomyFilter,
} from "@/lib/home-service-taxonomy";
```

- `filter` is optional: **no filter → previous behavior** (render all contractors passed
  in).
- When filtering, each professional's `professionType` is mapped through
  `professionalTaxonomyCategory` (canonical category via `PROFESSION_CATEGORY_MAP`).
- Filters: `category` (canonical id / legacy slug / label / alias), `audience`,
  `professionType`.
- Unknown category → safe empty result (component returns `null`, no crash, no guess).
- Professionals without a mapped profession are excluded while a filter is active.

The homepage still calls it with no filter today — the capability is available for
featured-by-category curations without touching the contractor store.
