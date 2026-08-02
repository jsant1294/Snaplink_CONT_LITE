# Routing & attribution

Unchanged by this redesign — the image-driven layout is a presentation change only. All
outbound links (chips and the primary CTA) still go through
`buildCrossPromoUrl(lang, inbound, categorySlug)` in `lib/southline-local-discovery.ts`, which
delegates to `buildSnaplinkLocalUrl`:

- **Destination host**: always the trusted CMS/default SnapLink base
  (`https://snaplink.southlineone.com/en|es/local`), checked against
  `ALLOWED_SNAPLINK_HOSTS` — never visitor input, never a value from the new
  `snapLinkPromo` image/layout settings.
- **Attribution**: `source=southline-living&placement=homepage-cross-promo` always appended.
- **UTM**: inbound `utm_source`/`utm_medium`/`utm_campaign`/`utm_content`/`utm_term` are
  forwarded only if present on the allowlist (`APPROVED_UTM_KEYS`); everything else in the
  visitor's query string is dropped.
- **Category slugs**: a chip forwards `category=<slug>` only when
  `CrossPromoCategory.snaplinkCategory` is a real, configured slug — never guessed. Chips
  without a mapping link to the directory root, same as before.
- **Open behavior**: `target="_blank" rel="noopener noreferrer"` — new tab, so the visitor's
  place in the Southline homeowner journey is preserved.

## Analytics

`snaplink_cross_promo_click` (`CROSS_PROMO_EVENT`) still fires for both chip clicks and the
primary CTA, via `window.dispatchEvent(new CustomEvent(...))` plus the optional `onExplore`
prop — both wrapped in `try/catch` so an analytics failure can never block navigation. No new
event was introduced for layout/image interactions; the spec's suggested
`snaplink_cross_promo_impression` was intentionally not added in this pass (it would require a
new IntersectionObserver-based hook with its own test coverage) — see
[06-test-results.md](./06-test-results.md) "Known limitations."

No PII is collected in any payload before or after this change (locale, chip id, category slug,
placement, timestamp, session id, and allowlisted UTM only).
