# 00 — Current catalog state

Status: **complete**. This doc originally recorded "Phase 1 — verified, no catalog code
changed yet" (the audit that preceded implementation); that line is now stale relative to the
actual code (`lib/southline-professional-catalog.ts`, `ProfessionalCatalogPanel.tsx`, the
homepage dual-source wiring) and has been superseded by this update plus
[01-display-adapter.md](./01-display-adapter.md) through [08-next-slice.md](./08-next-slice.md).

The original Phase 1 audit content (source separation, gap inventory, migration decision) was
accurate and is preserved below — nothing in it changed during implementation.

## Sources

| Source | Profile Type | Publicly Discoverable | Featured Control | Taxonomy Mapping | Gaps |
|--------|--------------|-----------------------|------------------|------------------|------|
| `contractors` store (`Contractor`, `lib/types.ts:76`) | Trades (remodeler, roofer, landscaper, plumber, HVAC, electrician, painting, handyman, etc.) | **Always** — any record present in the store renders at `/contractor/{username}`. No status/lifecycle field exists. | CMS list only: `SouthlineSettings.featuredContractorIds`, edited via `ProfessionalCatalogPanel` (this slice) and the older `FeaturedProsPicker`. Position in the array is the featured order. | Via `categoryIdsForContractor` (`lib/southline-search.ts`) — services → canonical category; `professionType` → canonical via `professionCategoryId`. | No `status`, no `featured` boolean, no `city`/`zip`/`state`, no `bio` (only `tagline`), no `updatedAt` (only `createdAt` — see [02-featured-ordering.md](./02-featured-ordering.md) for how the ordering tie-break handles this). Images: `avatarUrl`/`logoUrl` optional. |
| `agent_profiles` store (`AgentProfile`, `lib/agent-profiles/types.ts:54`) | Realtor, mortgage broker, architect, interior designer, inspector, photographer, property manager, appraiser, surveyor (licensed + any trade) | Only `status === "active"` AND `southlineStatus ∈ {published, featured}` — gated by `isSouthlineListedAgent` at `/agents/{slug}`, `/agents`, `/results`, and now the catalog adapter. | `featured` boolean + `southlineStatus === "featured"` (legacy public badge signal), plus CMS list `featuredAgentProfileIds`. Position in the array is the featured order. | Via `categoryIdsForAgent` — profession + category/specialty labels/ids/aliases → canonical. | No `city`/`zip`/`state` (uses `serviceArea`/`serviceAreas`); summary field is `marketplaceSummary` (plus `bio`); no `logoUrl` (only `photoUrl`/`coverPhotoUrl`). |

## Answers (unchanged from the original audit)

1. **How are contractors exposed to `/results`?** Passed as `Contractor[]` to `searchProfessionals`, matched by name/tagline/area/services/profession, rendered through `ProfessionalCard`. Every store record is public.
2. **How are agent-side professionals exposed?** Passed as `AgentProfile[]`; `searchProfessionals` internally gates `isSouthlineListedAgent`.
3. **Which records already have canonical taxonomy IDs?** Neither store persists taxonomy ids directly — mapping is computed at read time by `categoryIdsForContractor`/`categoryIdsForAgent`.
4. **Which rely on legacy labels or profession type only?** Agents can carry label strings that resolve through the taxonomy; contractors rely on `services` names + `professionType`.
5. **How is featured state stored today?** Two CMS ordered lists (`featuredContractorIds`, `featuredAgentProfileIds`) plus the legacy agent `southlineStatus === "featured"` signal (preserved, not removed).
6. **Is featured order stored today?** Array order in the CMS lists — no `featuredOrder` column. This slice uses exactly that as the deterministic order.
7. **Can operators feature both contractor and agent-side profiles?** Yes — now through one unified `ProfessionalCatalogPanel`, replacing the need to jump between two separate editors for a combined view.
8. **Which profile types lack images or summaries?** Both — contractors via placeholder photos, agents via `photoUrl`/summary fallbacks. See [06-fallback-behavior.md](./06-fallback-behavior.md).
9. **Which publication/suspension guards are already enforced?** Agents: `isSouthlineListedAgent`. Contractors: none — no lifecycle state exists, and this slice does not add one (would be a new identity concept, out of scope).
10. **Is a migration required?** **No.** Confirmed again post-implementation: `git diff` shows zero changes under `drizzle/`, and `tests/schema-drift.test.mjs` passes unchanged.

## What was actually built

- `lib/southline-professional-catalog.ts` — the display adapter (see [01](./01-display-adapter.md)).
- `components/southline/admin/ProfessionalCatalogPanel.tsx` — the unified admin control (see [03](./03-admin-panel.md)).
- A new "Professional Catalog" tab in `app/southline/admin/page.tsx`.
- Homepage `FeaturedProfessionals` now renders both contractor and agent cards with curated order (see [04](./04-homepage-integration.md)).
- `lib/southline-validation.ts` gained duplicate-id rejection for the two featured-id arrays (a defect found and fixed during this recovery pass — see [07-test-results.md](./07-test-results.md)).

## What was found broken and fixed during this recovery pass

See [07-test-results.md](./07-test-results.md) "Defects found and fixed" for the full list —
summary: the admin panel's "Open" action pointed contractors at their public page instead of
their operator workspace; there was no distinct "preview public profile" action; the homepage's
contractor cards showed a "Featured" badge unconditionally regardless of actual curated state;
and neither the render layer nor the settings validator guarded against a duplicate id in a
featured list.
