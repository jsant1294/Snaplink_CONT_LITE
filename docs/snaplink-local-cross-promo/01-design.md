# Design

## Layouts

Three CMS-selectable layouts (`SnapLinkPromoContent.layout`):

- **`image-left`** (default) / **`image-right`** — split editorial card. A rounded, bordered
  card (`rounded-3xl border border-walnut/15 bg-ivory`) with the image filling ~60% of the
  width (`md:col-span-3` of a 5-column grid) and the content panel the remaining ~40%
  (`md:col-span-2`). `image-right` flips the two panels via `md:order-1`/`md:order-2` — the
  image stays first in DOM order either way (see Mobile, below).
- **`full-background`** — full-bleed image with a dark gradient overlay and a text panel placed
  left or right (`contentAlignment`). Used when a section wants more visual drama than the card
  layout.

Both variants avoid the things the spec explicitly rules out: no plain white card with a small
decorative thumbnail, no generic SaaS-card grid, no dense icon grid — the photo is the primary
visual element in both layouts, not a secondary illustration.

## Mobile

The image block is first in the component's JSX in both split layouts (`image-left` and
`image-right` alike) — on mobile, where the grid collapses to a single column, the image always
renders above the text regardless of the desktop left/right choice. `md:order-*` only takes
effect at the `md` breakpoint, so mobile order is never affected by the desktop layout pick.
Desktop and mobile use separate `<img>` elements (`hidden md:block` / `md:hidden`, mirroring the
existing pattern in `components/southline/Hero.tsx`) so a distinct mobile image URL and mobile
crop/focal point can be configured independently of the desktop image.

Category chips scroll horizontally on narrow viewports (`overflow-x-auto`) instead of wrapping
into a tall block, and the CTA remains a normal tap target — no overlap with the image or
horizontal page overflow.

## Focal point & overlay

- `focalPoint` (`left` / `center` / `right`) maps to `object-left` / `object-center` /
  `object-right` on the desktop `<img>`; `mobileFocalPoint` (`top` / `center` / `bottom`) maps
  similarly on the mobile `<img>`. This lets an operator keep the subject of a differently-cropped
  image visible on both breakpoints without re-uploading.
- `overlayStrength` (`none` / `light` / `medium` / `strong`) only applies to the
  `full-background` layout, as a gradient darkening the side the text panel sits on
  (`contentAlignment`) so copy stays legible over a busy photo without darkening the entire
  image uniformly.

## Fallback behavior

If a configured image URL is missing or fails to load (`onError` on both the desktop and mobile
`<img>` elements), the section swaps to a soft brand-toned gradient panel
(`ImageFallback`, `from-walnut/25 via-gold/15 to-cream`) in the same slot — no broken-image
icon, no layout collapse, copy and CTA are unaffected.

## Visual language

Warm ivory/cream background, obsidian/clay text (cream/cream-85 on the dark `full-background`
overlay), champagne-gold accents (badge, CTA button), premium serif display heading via the
existing `font-display` utility, soft `rounded-3xl` corners on the split card, restrained hover
transitions on chips and the CTA — matching the rest of the Southline Living homepage rather
than introducing a new visual system for this one section.
