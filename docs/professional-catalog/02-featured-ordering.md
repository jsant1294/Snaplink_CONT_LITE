# 02 — Featured Ordering

## The rule

```text
featuredOrder ascending
→ updatedAt descending
→ displayName ascending
```

Implemented once, in `cardComparator` (`lib/southline-professional-catalog.ts`):

```ts
function cardComparator(a, b) {
  const af = a.featuredOrder ?? Number.MAX_SAFE_INTEGER;
  const bf = b.featuredOrder ?? Number.MAX_SAFE_INTEGER;
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  if (af !== bf) return af - bf;
  const au = a.updatedAt ?? "";
  const bu = b.updatedAt ?? "";
  if (au !== bu) return bu.localeCompare(au); // descending
  return a.displayName.localeCompare(b.displayName); // ascending
}
```

Verified with real fixtures, not just reading the code (`tests/professional-catalog.test.mjs`
13–15): featured records sort by their position in the curated id list first; among
non-featured (or equally-ranked) records, the more recently updated one sorts first; when both
are equal, alphabetical `displayName` breaks the tie deterministically — the same two inputs
always produce the same order.

## Where the order comes from

There is no `featuredOrder`/`sort_order` column on either store. **Array position in the CMS
list is the featured order** — `featuredContractorIds`/`featuredAgentProfileIds` on
`SouthlineSettings`, the same fields the pre-existing `FeaturedProsPicker` already wrote. This
slice adds a second writer (`ProfessionalCatalogPanel`) and a second reader
(`listSouthlineProfessionals`), not a new storage location.

`featuredRank(list, id)` is `list.indexOf(id)` — a record not in the list gets `-1`, which the
comparator treats as `Number.MAX_SAFE_INTEGER` (sorts after every featured record). A stale id
in the list that no longer matches a live record is simply never looked up from the source-record
side, so it has no effect — see [07-test-results.md](./07-test-results.md) test 29.

## Two call sites, one rule

- `listSouthlineProfessionals` — the full adapter, used by the admin panel's diagnostics and
  available for any future consumer that wants the neutral card shape.
- `orderProfessionalResults` — a lighter function that annotates and sorts raw
  `ProfessionalResult[]` (the shape `/results` already uses) without going through the full card
  adapter, so `/results` gets curated ordering without a data-shape change.

Both derive `feature rank` the same way (`indexOf` against the curated list); they are
intentionally two entry points onto one shared ordering concept, not two different orderings.

## Known limitation: contractor `updatedAt`

`Contractor` has no real `updatedAt` field — only `createdAt`. `contractorToCard` uses
`c.createdAt` for the `updatedAt` tie-break slot. This means two non-featured contractors will
tie-break on *creation* recency, not last-edited recency, until (if ever) the contractor model
gains a real `updatedAt` column — which would be a schema change, explicitly out of scope for
this slice. Documented here rather than silently accepted as correct.
