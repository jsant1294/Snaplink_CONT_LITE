# 03 — Legacy & Alias Mappings

Status: Phase 8 — complete.

## 1. Local Discovery legacy slugs

`LOCAL_DISCOVERY_LEGACY_MAP` documents the shipped `internalSlug` values from
`lib/southline-local-discovery.ts` (Southline-owned, unchanged — see
`06-local-discovery-compat.md`). `resolveCategoryId()` uses it as a **fallback**
when the input is not already a canonical category id.

| Legacy slug | Canonical category | Notes |
|-------------|--------------------|-------|
| `builders-remodelers` | `remodeling` | Local Discovery card → `/results?category=remodeling` |
| `architects` | `remodeling` | Current `internalSlug`; distinct from the `architecture-design` category |
| `interior-designers` | `remodeling` | Current `internalSlug` |
| `landscaping` | `outdoor` | Card id vs canonical `outdoor` |
| `roofing` | `roof_exterior` | Card id vs canonical `roof_exterior` |
| `pools` | `outdoor` | Local Discovery card still routes to `outdoor` |
| `photography` | `photography` | Card id == canonical id |
| `real-estate` | `real-estate` | Card id == canonical id |

**Canonical-wins rule:** when a legacy slug is also a real category id, the canonical
category wins in `resolveCategoryId`. Example: `pools` resolves to `pools` (the new
canonical category under Pools & Spas), while Local Discovery's own routing for the
`pools` card keeps returning `outdoor`. The two layers are independent and both
behaviors are tested.

## 2. Bilingual search aliases

`resolveCategoryId()` and `categoryMatchTerms()` also resolve **labels and aliases** in
both languages. Examples from the brief plus the shipped search fixtures:

| Input | Resolves to |
|-------|-------------|
| `techador` (roofer, es) | `roof_exterior` |
| `roofer` (en noun) | `roof_exterior` |
| `fotógrafo` (photographer, es) | `photography` |
| `realtor` | `real-estate` |
| `plomero` (plumber, es) | `plumbing` |
| `Bienes Raíces` | `real-estate` |
| `Painting & Drywall` | `paint_drywall` |
| `Techos y Exterior` | `roof_exterior` |

Aliases are **search-only**: never stored, never routed externally, never used as a
fallback target.

## 3. No-guess rule

`resolveCategoryId()` returns `undefined` for anything unknown. Callers must not fall
back to a guessed or unrelated category. In search, an unknown `category` param simply
filters to an empty result set (tested by tests 13 and 21).
