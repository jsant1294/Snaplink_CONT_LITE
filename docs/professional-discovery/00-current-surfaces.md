# 00 — Current Display Surfaces: Professional Discovery

Status: Phase 1 — audit complete. No code changed during this phase.

Scope: every **public** surface that displays service categories on Southline Living.
Contractor dashboard surfaces (`/contractor-admin`, Estimator, ProjectPlanner,
BookingFlow) are intentionally out of scope — this slice is display-only for the
public marketplace and must not change contractor ownership.

| Surface | Current Source | Hardcoded | Uses Taxonomy | Action |
|---------|----------------|-----------|---------------|--------|
| `/results` category chips | `SERVICE_CATEGORIES` (10, `app/results/page.tsx:83`) | yes | no | Phase 2 — replace with `listSouthlineHomeServices({ locale, audience: "both" })` |
| `/results` search + category filter | `searchProfessionals` (`lib/southline-search.ts`) | no | yes (prior slice) | Phase 5 — keep; verify safe empty state for unknown filters |
| `/results` empty state | `resultsEmpty` / `searchNoResults` i18n | yes (copy) | no | keep — never crash on unknown filters |
| Home Services homepage block (`FeaturedServicesEntryBlock`) category strip | `PROFESSION_TYPES` (18, `components/southline/FeaturedServicesEntryBlock.tsx`) | yes | no | Phase 3 — taxonomy-driven cards → `/results?category=` |
| Home Services featured card | CMS `HomeServicesContent` + `DEMO_FEATURED_PROFESSIONAL` | no (CMS) | no | Phase 3 — keep (image-driven, CMS selections preserved) |
| Featured Professionals (`FeaturedProfessionals`) | `featuredContractors` (homepage `featuredContractorIds` or all) | no filtering | no | Phase 4 — taxonomy filtering (featured / category / audience / profession) |
| Professional Directory | = `/results` (shared page) | — | search yes | Phase 5 — taxonomy filters/labels/aliases/profession mapping |
| Hero search form | GET form → `/results` | no | no | keep |
| Search overlay (`SearchOverlay`) | `/api/southline/search` (`searchProfessionals`) | no | search yes | keep |
| Inspiration grid (`CategoriesGrid`, homepage + `/ideas/[category]`) | `DEFAULT_CATEGORIES` / `settings.categories` (ideas `SouthlineCategory`) | yes (content) | no | **no action** — ideas content, not home-service taxonomy |
| CMS homepage settings (`HomepageEditor`) | CMS lists (categories, home services, trending…) | — | no | Phase 6 — add read-only Taxonomy tab (no CRUD) |
| Local Discovery (`LocalDiscovery`) | `DEFAULT_LOCAL_DISCOVERY` / settings | content | no | Phase 7 — **unchanged** (photography→SnapLink, rest→Southline, `/results` internal) |
| `/api/southline/search` | `searchProfessionals` | no | search yes | keep |

## Duplicate category arrays (acceptance target)

Two hand-rolled category lists currently power public display, duplicating the
taxonomy registry from `lib/home-service-taxonomy.ts`:

1. `SERVICE_CATEGORIES` → `/results` chips (`app/results/page.tsx`).
2. `PROFESSION_TYPES` → Home Services category strip (`FeaturedServicesEntryBlock`).

Both are replaced by the shared taxonomy in this slice. After the change, the only
`SERVICE_CATEGORIES` consumers are the contractor dashboard surfaces (in scope of the
contractor, intentionally untouched).

## Key invariants preserved

- URLs / query params: `?q=…&category=<id>` on `/results` unchanged.
- Local Discovery ownership unchanged (`getCategoryDestination` is the only router).
- Photography → SnapLink exception unchanged.
- Contractors and agents keep separate stores and separate display cards; the
  taxonomy only normalizes display and filtering.
