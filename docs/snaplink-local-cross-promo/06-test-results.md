# Test results

## Targeted tests

`node --test tests/southline-cross-promo.test.mjs` — **23/23 passing** (12 pre-existing + 11 new
for this redesign):

- `DEFAULT_SNAPLINK_PROMO` ships a verified image, safe defaults, no guessed content
- `mergeSnapLinkPromoContent` backfills missing fields, preserves operator edits
- `defaultSouthlineSettings()` backfills `snapLinkPromo` for legacy settings
- both stores (`southline-store-json.ts`, `southline-store-pg.ts`) merge `snapLinkPromo` against
  defaults
- settings validation rejects invalid `layout`/`overlayStrength`/`focalPoint`/boolean values,
  accepts a valid patch
- component renders all three layouts, focal points, and the alignment-aware overlay
- image `onError` fallback never leaves a broken-image state
- mobile image block precedes the content block in source order (mobile-first "image above
  text") regardless of the desktop `image-left`/`image-right` choice
- chips stay capped and secondary (`slice(0, 6)`, hidden entirely when empty)
- the Homepage admin editor exposes the new tab with image/layout/visibility controls
- the upload route allowlists the `snaplink-promo` image kind
- all 12 pre-existing cross-promo tests (URL builder, host allowlist, UTM handling, analytics,
  new-tab behavior, homepage wiring, sections toggle) still pass unmodified in behavior — only
  the one assertion asserting the exact `<SnapLinkLocalPromo .../>` JSX was updated to include
  the new `content` prop

## Regression suites

- `npx tsc --noEmit` — clean, no errors.
- `npm run build` — clean production build (verified with a temporary isolated `distDir` so it
  didn't collide with any other locally-running dev server against the same `.next` directory;
  reverted immediately after).
- `node --test tests/*.test.mjs` — **398/410 passing**. The 12 failures are pre-existing and
  unrelated to this change:
  - 6× "Lucio Financial Copilot (tax/payment) code is untouched by this pass" — these tests run
    `git diff --name-only 3552ded -- app/api/contractor/expenses ...` against a hardcoded base
    commit; the diff they're flagging is from a separate, already-merged commit
    (`51be33f`, a website/gallery/landing-page/Money-module feature) that predates this session
    entirely. Confirmed via `git log 3552ded..HEAD -- <those paths>`, which shows only that one
    unrelated commit. Nothing in this redesign touches any LFC path.
  - 1× `tests/agent-pg-review.test.mjs` — fails with `ERR_MODULE_NOT_FOUND` for
    `lib/db/schema` when run outside the project's extensionless-import test loader
    (`tests/register-extensionless.mjs`); a pre-existing test-runner setup detail unrelated to
    this feature.
  - No test that was passing before this change started failing because of it.

## Manual verification

- Server-rendered HTML confirmed directly (via a running local dev server on this repo) for the
  default `image-left` layout: correct image `src` (the shipped Unsplash URL), correct alt text,
  correct badge/headline/body/chip/CTA markup, correct `md:order-1`/`md:order-2` classes.
- The candidate image was downloaded and visually reviewed before being set as the default (see
  [02-image-source.md](./02-image-source.md)) — not selected from a search result title alone.

## Known limitations

- No automated visual/screenshot test (no headless-browser tooling — e.g. Playwright — is
  installed in this repository); verification here is server-rendered-HTML + `tsc`/`build`, plus
  one direct visual review of the shipped photo. A real cross-device visual pass (actual mobile
  viewport, actual `full-background`/`image-right` variants, actual overlay strengths) has not
  been done and is recommended before treating every layout permutation as pixel-verified.
- `snaplink_cross_promo_impression` (suggested in the originating spec) was not added — only the
  existing `snaplink_cross_promo_click` event fires. Adding an impression event needs a new
  IntersectionObserver-based hook and its own test coverage; left for a follow-up slice.
- No dedicated `SnapLinkLocalPromoEditor.tsx` component was created; the fields live as a new tab
  inside the existing `HomepageEditor.tsx`, consistent with how every other homepage section
  (Hero, Seasonal, Home Services, Categories) is already edited in this CMS. A standalone editor
  component would duplicate that existing pattern rather than extend it.
- No dedicated CMS diagnostics/status badge was added for this section (see
  [03-cms-controls.md](./03-cms-controls.md) "Diagnostics" for why).
- Headline/body/CTA copy is still sourced from the i18n dictionary, not per-field CMS text
  inputs — matches this section's pre-existing content model; changing that would be a larger,
  separate change affecting how every other homepage section stores copy.

## Recommended next slice

A real cross-device visual QA pass (mobile viewport screenshots, all three layouts, all four
overlay strengths) once headless-browser tooling is available in this environment, plus an
impression-analytics event if product wants funnel visibility above the click event that already
exists.
