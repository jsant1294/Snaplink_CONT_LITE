# 08 — Recommended Next Slice

Things found during this recovery pass and deliberately not fixed, in rough priority order.

## 1. Rollback-on-save-failure in the admin panel

`ProfessionalCatalogPanel.tsx`'s `toggleFeatured`/`move` apply the local state change
(`setFeaturedContractorIds`/`setFeaturedAgentProfileIds`) *before* awaiting the PATCH request,
and never revert it if the request fails — the failure toast shows, but the checkbox/order in
the UI stays as if the save succeeded until the next page load. Fixing this cleanly means
capturing the previous state and restoring it in the catch block — a real behavior change
correctly out of scope for "finish the existing slice," worth a small, focused follow-up.

## 2. Contractor `updatedAt`

Documented in [02-featured-ordering.md](./02-featured-ordering.md): contractors have no real
`updatedAt` field, so the ordering tie-break uses `createdAt` instead. This is stable and
correct, just not what "updatedAt" literally implies. Adding a real `updatedAt` column would be
a schema change — explicitly out of scope for this pass, and not obviously worth it on its own
(would need a real justification beyond "the field name is slightly imprecise").

## 3. Category filter uses English labels only

`ProfessionalCatalogPanel.tsx`'s category `<select>` renders `c.labelEn` regardless of the
operator's own language preference — the rest of the Southline admin doesn't consistently
localize operator-facing (as opposed to visitor-facing) UI either, so this isn't a regression,
just a pre-existing pattern this slice didn't change. Worth deciding deliberately if/when the
admin console gets a real localization pass.

## 4. Full click-through verification

No headless-browser tooling exists in this environment (same limitation noted throughout this
session's UI work). The admin panel's feature/unfeature/reorder/preview flow was verified via
source-level tests and direct code reading, not an actual browser session. A real
Playwright-driven pass (feature a contractor, confirm it appears on the homepage in the right
position, unfeature it, confirm it's gone) would close this gap.

## 5. Contractor lifecycle state

Both this slice's audit and the original professional-discovery lineage flag the same
architectural gap: contractors have no `status` field, so they're always publicly visible with
no way to draft/suspend/archive one the way agent profiles already support. This is explicitly
**not** something to fix casually — it's a new identity/lifecycle concept on the contractor
model, which both this slice's brief and the original taxonomy slice's docs call out as requiring
its own approved, deliberate slice (not an add-on to a display/catalog pass).

## 6. Sponsored/paid featured placement

Out of scope here entirely, but worth cross-referencing: `docs/product-packaging/
02-southline-marketplace-products.md` (an earlier packaging-strategy pass this session)
describes "Featured Professional Listing" as a purchasable product, distinct from the
operator-curated featuring this catalog panel provides. This slice's featured lists remain
100% operator-controlled with no billing relationship — exactly as scoped. If featured placement
is ever meant to be something a professional can buy rather than something an operator grants,
that's a real product decision requiring its own slice, not an extension of this one.
