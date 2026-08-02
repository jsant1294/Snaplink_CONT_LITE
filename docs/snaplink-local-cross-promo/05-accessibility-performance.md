# Accessibility & performance

## Accessibility

- Localized alt text (`imageAltEn`/`imageAltEs`) is used on both the desktop and mobile
  `<img>` elements, selected by `lang` — same pattern as `Hero.tsx`'s `heroImage`.
- The section keeps its single `<h2 id="snaplink-local-promo-title">` and
  `aria-labelledby="snaplink-local-promo-title"` on the `<section>`, so the heading/landmark
  relationship is unchanged by the new layouts.
- Text contrast: on the `full-background` layout, copy renders in `text-cream`/`text-cream/85`
  over a dark gradient overlay rather than directly on the raw photo, and the overlay direction
  follows `contentAlignment` so the gradient always darkens the side the text sits on.
- CTA and chips remain real `<a>` elements with visible `focus-visible:ring-*` states and
  `hover:` affordances; nothing is a `<div onClick>`.
- `motion-reduce:transition-none` / `motion-reduce:hover:translate-y-0` /
  `motion-reduce:active:scale-100` are preserved on the CTA/chip hover transitions (unchanged
  from before this redesign).
- Mobile tap targets: chips (`px-4 py-2`) and the CTA (`px-6 py-3`) are unchanged in size from
  the previous version.
- Decorative elements (the gold "S" mark, the emoji on each chip, the fallback gradient panel,
  the CTA arrow) all carry `aria-hidden="true"`; the meaning is in the adjacent text.

## Performance

- Images use native `loading="lazy"` — the section renders below the hero/local-discovery
  blocks, so it is not an LCP candidate on first paint.
- Two `<img>` elements per layout (desktop + mobile, one hidden via CSS at each breakpoint) —
  same technique already used by `Hero.tsx`, not a new pattern. No `next/image` was introduced:
  this repository has no existing `next/image` usage or `images.remotePatterns` configuration
  anywhere, and none was added for this feature — the plain `<img>` + Tailwind `object-cover`
  approach was chosen to match the codebase's existing convention rather than introducing a new
  one for a single section (see "Known limitations" in
  [06-test-results.md](./06-test-results.md)).
- No client-side data fetching was added; `content` arrives as a server-rendered prop from
  `app/page.tsx`, same as `heroImage` does for `Hero`.
