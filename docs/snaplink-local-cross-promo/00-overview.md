# SnapLink Local Cross-Promo — Image-Driven Redesign

## What changed

The homepage "SnapLink Local" cross-promotion (`components/southline/SnapLinkLocalPromo.tsx`,
rendered from `app/page.tsx` right after Local Discovery, gated on `sections.localPromo`) was
text-heavy: eyebrow, headline, paragraph, category chips, one CTA, no imagery. It's now
image-driven — a wide editorial lifestyle photo carries the visual weight, with copy, chips,
and the CTA as supporting content.

## Scope

In scope: the cross-promo section's presentation (image, layout, focal point, overlay,
visibility toggles) and a new CMS editor tab for it.

Out of scope (untouched): Local Discovery category-ownership routing, Photography's SnapLink
exception, Homes, Rentals & Getaways, agent management, professional identity, billing. The
outbound URL builder (`buildCrossPromoUrl` / `buildSnaplinkLocalUrl` in
`lib/southline-local-discovery.ts`), the SnapLink host allowlist, UTM handling, and the
`snaplink_cross_promo_click` analytics event are all unchanged — the redesign only changes how
the section looks, not where it points people.

## Architecture

- **Component**: `components/southline/SnapLinkLocalPromo.tsx` — renders one of three layouts
  (`image-left`, `image-right`, `full-background`) driven by CMS content. A dedicated
  `SnapLinkLocalPromoEditor` component was not created; the section's image/layout/visibility
  fields were added as a new tab inside the existing `HomepageEditor.tsx`, consistent with how
  Hero/Seasonal/Home Services are already edited in this repo (one CMS editor with per-section
  tabs, not one editor component per homepage section).
- **Content type**: `SnapLinkPromoContent` in `lib/southline-types.ts`, stored as
  `SouthlineSettings.snapLinkPromo`. Headline/body/CTA copy stays in the i18n dictionary
  (`lib/southline-i18n.ts`, `localPromo*` keys) — this section's CMS-editable surface is the
  image and its presentation, matching the existing "content in i18n, media/layout in CMS"
  split used by Hero (`heroImage`) and Seasonal.
- **Store**: both `lib/southline-store-json.ts` and `lib/southline-store-pg.ts` merge
  `stored.snapLinkPromo` against `DEFAULT_SNAPLINK_PROMO` on every read
  (`mergeSnapLinkPromoContent`), so existing settings rows without this field get it
  automatically — no migration needed (`snapLinkPromo` lives inside the existing settings jsonb
  blob / JSON file, not a new table/column).

See [01-design.md](./01-design.md), [02-image-source.md](./02-image-source.md),
[03-cms-controls.md](./03-cms-controls.md), [04-routing-and-attribution.md](./04-routing-and-attribution.md),
[05-accessibility-performance.md](./05-accessibility-performance.md), and
[06-test-results.md](./06-test-results.md) for the rest.
