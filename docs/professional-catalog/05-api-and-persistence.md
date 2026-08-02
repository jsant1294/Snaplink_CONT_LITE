# 05 — API & Persistence

## No new routes

The catalog reuses three existing routes end to end:

- `GET /api/contractor/profiles` — public contractor listing (unauthenticated by design).
- `GET /api/agent-profiles` — operator-authenticated agent listing.
- `GET`/`PATCH /api/southline/settings` — the existing Southline CMS settings resource.

Nothing under `/api/southline/catalog`, `/api/professional-catalog`, or similar was created.
Verified by source assertion (`tests/professional-catalog.test.mjs`, test 28): the panel's PATCH
call targets `/api/southline/settings` and the panel source contains no reference to any
catalog-specific route path.

## What gets persisted

`featuredContractorIds: string[]` and `featuredAgentProfileIds: string[]` on `SouthlineSettings`
— both fields existed before this slice (written previously by `FeaturedProsPicker`/the
real-estate block editor). This slice adds a second, unified writer, not a new field.

## Validation — defect found and fixed

`lib/southline-validation.ts`'s `validateSouthlineSettings` already checked that both fields, if
present in a PATCH body, were arrays of strings. It did **not** check for duplicate entries — a
PATCH containing `{"featuredContractorIds": ["a", "b", "a"]}` would have passed validation and
been persisted, which is exactly the input that makes a professional's card render twice on the
homepage (see [04-homepage-integration.md](./04-homepage-integration.md)). Fixed:

```ts
const ids = patch[key] as string[];
if (new Set(ids).size !== ids.length) {
  return `${key} must not contain duplicate ids`;
}
```

The PATCH now fails with a 400 and a clear message instead of silently persisting a
duplicate-producing state. Verified with real invalid and valid payloads
(`tests/professional-catalog.test.mjs`, test 16c).

## Both stores, unchanged

`southlineStore` (JSON and Postgres variants) required no changes — `featuredContractorIds`/
`featuredAgentProfileIds` are plain string arrays already covered by each store's generic merge/
persist logic. No migration, no new column, no new table.
