# 06 — Fallback Behavior

## Images

- **Contractor**: `c.avatarUrl || c.logoUrl || professionPlaceholderPhotoFor(c.id,
  c.professionType)`. The placeholder is a real, verified Unsplash URL, deterministic per
  contractor+profession (same contractor always gets the same placeholder), never a blank box or
  broken-image icon.
- **Agent**: `a.photoUrl || professionPlaceholderPhotoFor(a.id, a.professionType)` — same
  fallback function, same guarantee.
- Verified with fixtures carrying no image field at all (`tests/professional-catalog.test.mjs`,
  test 19): `imageUrl` is always a non-empty, real `https://` URL.

## Summaries

- **Contractor**: `c.tagline || fallbackSummary(professionLabel, c.serviceArea)`.
- **Agent**: `a.marketplaceSummary || a.bio || a.tagline || fallbackSummary(professionLabel,
  serviceArea)`.
- `fallbackSummary` produces exactly one of two factual sentences — `"{profession} serving the
  {area} area."` or, if no area is set, `"{profession} available through Southline."` — never an
  invented credential, years-of-experience claim, or specialty. Verified
  (`tests/professional-catalog.test.mjs`, test 20) that the fallback text contains the real
  service area and never matches rating/review/certification language.

## Unknown taxonomy values

`professionCategoryId(professionType)` is a plain object lookup (`PROFESSION_CATEGORY_MAP[id]`)
that returns `undefined` for anything not in the map — no throw, no guess. The adapter carries
that `undefined` through as `primaryCategoryId: undefined`; nothing downstream treats a missing
category as an error condition that stops rendering.

## Diagnostics status model

`catalogDiagnostics(contractors, agents)` returns one row per record with a status:

| Status | Meaning |
| --- | --- |
| `ready` | Public, taxonomy-mapped, has both an image and a summary/tagline. |
| `warning` | Public and taxonomy-mapped, but missing an image and/or a summary/tagline (still renders — a placeholder image and a factual fallback summary cover this — this status is about *content completeness*, not visibility). |
| `hidden` | Not publicly discoverable (agent only — `status`/`southlineStatus` don't satisfy `isSouthlineListedAgent`; the diagnostic reason states which check failed, e.g. `status is "suspended"`). |
| `unmapped` | Profession type has no canonical category — the record is public but can never be found via category filtering. |

Every branch was exercised with a real fixture (`tests/professional-catalog.test.mjs`, tests 21,
22, plus the publication-gate tests 5–8) — an unmapped or hidden record never causes a crash or a
silently-dropped row; it always appears in the diagnostics list with an explanatory reason.
