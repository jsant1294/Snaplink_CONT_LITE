# 05 — CMS read-only taxonomy view

Status: done (Phase 6).

`HomepageEditor` (Southline admin) gained a **Taxonomy** tab — read-only, no CRUD, no
`PATCH`:

- Overview counts: groups / categories / active / specialties, with a note that public
  chips and cards render from `lib/home-service-taxonomy.ts` (categories are code, not
  CMS content).
- Per-group category list: EN label, ES label, canonical id, `audience` tag,
  `featured` badge, `inactive` warning.
- **Legacy Local Discovery → taxonomy** table: each legacy slug and its canonical
  resolution.
- **Configured Local Discovery categories**: the `internalSlug`/id stored in CMS
  settings is resolved through `resolveCategoryId`; unknown ids are flagged
  `unknown — skipped` (they are skipped at render time by the Local Discovery routing).

The tab renders from the taxonomy's pure data exports only; it deliberately has no save
handler.
