# Category Mapping

## The problem this solves

Southline's CMS lets an operator define local category cards (e.g. "Roofing",
"Landscaping") with bilingual labels, icons, images, and ordering — but
SnapLink Local has its own canonical category taxonomy/slugs. These two lists
are **not guaranteed to be the same**, and a category can exist in Southline's
CMS before anyone has confirmed the matching SnapLink slug.

Every one of the 8 shipped default categories starts with
`snaplinkCategory: null` — they are entry-point placeholders, not proof that
SnapLink recognizes a matching slug.

## The fix

`resolveSnaplinkCategory()` in `LocalDiscovery.tsx`:

```ts
function resolveSnaplinkCategory(selected) {
  if (selected.snaplinkCategory) return selected.snaplinkCategory;
  console.warn(/* configuration warning: category has no snaplinkCategory mapping */);
  return null;
}
```

- **Mapped** category → its `snaplinkCategory` slug is forwarded as the
  `category` query param.
- **Unmapped** category → the `category` param is **omitted entirely**. It
  never falls back to the Southline category `id`, which SnapLink's directory
  would likely not recognize as a valid filter.
- Either way, this **never throws** — a missing mapping is a warning, not a
  crash.

`buildSnaplinkLocalUrl({ category: null })` (or `undefined`) simply skips the
`category` param.

## CMS editing

Each category row in the CMS editor has a **"Featured this category slug maps
to on SnapLink Local"** input (the `snaplinkCategory` field). Categories with
no mapping show an inline warning in the editor, and a fully-unmapped set of
*visible* categories drives the CMS status badge to `warning` (see
[01-architecture.md](./01-architecture.md)).

## Seasonal tag

Each category also carries an optional `seasonalTag` (e.g. `"winter"`,
`"spring-cleanup"`) — a free-text label for future seasonal
surfacing/promotion logic. It does not currently affect the outbound URL or
card rendering order; it is CMS-editable metadata only, defaulting to `null`.
