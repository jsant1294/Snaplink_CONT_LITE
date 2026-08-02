# 05 — Southline Integration

Status: Phase 5 — complete.

## Adapter

`listSouthlineHomeServices(options)` (in `lib/home-service-taxonomy.ts`) is the
Southline-facing read API. Pure and store-free, like `lib/southline-search.ts`.

```ts
listSouthlineHomeServices({ locale: "es", audience: ["contractor", "professional"] })
```

| Option | Behavior |
|--------|----------|
| `locale` | `"es"` resolves `label` to `labelEs`, else `labelEn` |
| `audience` | `"contractor"`, `"professional"`, `"both"`, or an array; default = all |
| `featuredOnly` | keep only `featured` categories (currently none flagged) |
| `parentId` | restrict to one top-level group |
| `search` | substring match over all match terms (labels, aliases, group labels) |

**Acceptance (Phase 5):** Southline consumes both `audience = contractor` and
`audience = professional` categories. The default list mixes them; tests 28–31 cover
locale resolution, audience filtering, group/search filtering, and ordering.

## Unified search

`lib/southline-search.ts` now consumes the taxonomy for matching (Phase 7):

- **Query haystack (contractors)** expands each service through
  `specialtyMatchTerms()` (EN/ES labels, aliases, parent-category + group labels) and
  adds the profession's category terms.
- **Query haystack (agents)** expands `categories[]`/`specialties[]` through
  `resolveCategoryId()` / `getHomeServiceSpecialty()`, and always adds the
  profession-derived category terms (so a photographer is found by `fotógrafo`, a
  realtor by `Bienes Raíces`, etc.).
- **Category filter** is resolved via `resolveCategoryId()` (id, legacy slug, label, or
  alias). Unknown values stay unknown → empty result set, never a guess.

Result: Spanish aliases like `techador`, `canaletas`, and `fotógrafo` now find the same
professionals that English canonical names always did, with **no duplicate results**
(tests 14–23).

## Public pages

- `/results` chips and routing are **unchanged** (still `SERVICE_CATEGORIES`), keeping
  existing routing tests green.
- `/api/southline/search` reuses `searchProfessionals`; unchanged.

## Not changed

Ideas cards, Local Discovery cards, homepage "Home Services" content, and the CMS
remain as-is. Swapping `/results` chips to the full taxonomy (including professional
categories) is a display-only change deferred to `08-next-slice.md`.
