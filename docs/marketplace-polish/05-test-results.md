# Test Results

## New tests

`tests/marketplace-polish.test.mjs` — **20/20 passing**:

- Profile rendering: `AgentProfilePublicPage` has real responsive breakpoints (not permanently
  phone-width), falls back to the deterministic stock photo instead of rendering nothing, and
  its CTAs resolve through `t()` instead of hardcoded English literals.
- Image fallbacks: the new `visitWebsite`/`viewFullSnaplinkProfile` keys exist bilingually; the
  agent directory (`/agents`) uses the same `professionPlaceholderPhotoFor` fallback as every
  other card.
- `ContractorPublicPage` accepts and is seeded by a `lang` prop (guards against the exact bug
  found: `useState<Lang>("en")` hardcoded with no prop); the route wrapper is asserted to
  actually pass `lang={lang}` through.
- Category rendering: `/ideas/[category]` is asserted to filter via the real
  `categoryIdsForContractor()` helper and the new bridge map — and, separately, every id used in
  that bridge map is checked against the real `SERVICE_CATEGORIES` list in `lib/services.ts` so
  the mapping can never silently reference a category that doesn't exist. Empty state and
  back-navigation link presence are both asserted.
- CTA rendering: `ProfessionalCard`'s touch targets (`min-h-[44px]`) and category badge (sourced
  from real `pro.categories[0]`, never invented) are asserted.
- Bilingual labels: every microcopy fix in
  [04-copy-review.md](./04-copy-review.md) has a corresponding "old hardcoded string is gone, new
  `t()` key is present" test pair.
- No broken public routes: not tested via a dedicated route-crawl (no headless-browser tooling in
  this environment — same limitation noted in prior polish passes this session), but every
  touched route was hit directly against a running local dev server and confirmed `200` with the
  expected new markup present — see "Manual verification" below.
- Trust: an explicit guard asserts no rating/review/star pattern exists on any of the five
  touched public-facing files (word-boundary matched, so it doesn't false-positive on legitimate
  text like `items-start` or `reviewsUrl`).

## Regression

`node --test tests/*.test.mjs` — **519/527 passing**. All 8 failures are pre-existing and
unrelated to this pass, each already confirmed earlier in this session:

- 6× "Lucio Financial Copilot code is untouched by this pass" — a stale hardcoded git-diff base
  commit check against `app/api/contractor/expenses` etc., unrelated to any marketplace surface.
- 1× `tests/agent-pg-review.test.mjs` — pre-existing extensionless-import test-runner quirk when
  run outside the project's special module loader.
- 1× "every profession type has a landing template" — a concurrent session's in-progress
  "photographer" profession-type addition missing its landing-page template
  (`lib/landing-templates.ts`), a file this pass never touched.

No test that was passing before this pass started failing because of it.

## Type check and build

`npx tsc --noEmit` — clean.
`npm run build` — clean (verified with a temporary isolated `distDir`, reverted immediately
after, same discipline used throughout this session to avoid colliding with the locally-running
dev server).

## Manual verification

Hit directly against a running local dev server (this repo, hot-reloaded):

- `GET /p/camila-reyes-test` → `200`, response body contains `sm:max-w-2xl` and `lg:max-w-4xl`
  (the new responsive classes) and does **not** contain the literal string "Book a Consultation"
  anymore (confirms the `t()` swap took effect, not just that the source file changed).
- `GET /ideas/cocinas` → `200`, response body contains at least one `<img>` tag (the
  previously-bare card now has a photo) and the literal string "Browse all services" (the new
  `t("browseAllServices", lang)` key, confirmed rendering in the default English state).
- `GET /results`, `GET /agents` → both `200`.

No headless-browser screenshot verification was performed (no such tooling installed in this
environment) — visual/pixel-level review is a known gap, same limitation flagged in prior UI
work this session.
