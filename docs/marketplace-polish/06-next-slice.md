# Recommended Next Slice

Things found and deliberately deferred during this pass, in rough priority order.

## 1. Consolidate the four professional card implementations into one

`ProfessionalCard.tsx` (canonical, `ProfessionalResult`-shaped), `FeaturedProfessionals.tsx`
(two more inline reimplementations, one per identity type, with an inconsistency where the
contractor half always shows "Featured" and the agent half doesn't), `/ideas/[category]`, and
`/agents` directory each maintain their own card markup. This pass brought the two weakest visual
outliers (`/ideas/[category]`, `/agents`) up to parity with the same photo-fallback/badge
treatment, but didn't merge any of them — the underlying data shapes differ (`Contractor` vs
public `AgentProfile` vs `ProfessionalResult`), so a real consolidation needs either a shared
adapter function or a card component that accepts a smaller, common prop shape. Worth doing
because every future visual tweak currently has to be applied in up to four places by hand.

## 2. Merge (or formally bridge) the two i18n dictionaries

`lib/southline-i18n.ts` and `lib/i18n.ts` are both real, both actively used, and don't know about
each other. This pass fixed the one concrete bug it caused (contractor profile page ignoring the
language cookie) without touching the dictionaries themselves — see
[04-copy-review.md](./04-copy-review.md) for why. A real fix needs an audit of every consumer of
`lib/i18n.ts`, not a spot fix.

## 3. Agent profile gallery

`AgentProfile` has no `galleryUrl`/`galleryUrls` field, unlike `Contractor`, which has both and
renders a real gallery grid. Adding this needs a new schema field on `agent_profiles` — explicit
infrastructure work, out of scope for "Do not build new infrastructure." Worth flagging because
it's a real content gap: a licensed professional (photographer, designer, architect) whose work
is inherently visual currently has no way to show a portfolio on their public profile at all.

## 4. Real cross-device visual QA

No headless-browser tooling exists in this environment (confirmed, same limitation noted in
earlier UI work this session). Everything in this pass was verified via source assertions plus
direct HTTP checks against a running dev server, not actual rendered screenshots at real
viewport sizes. The responsive layout changes in
[03-mobile-review.md](./03-mobile-review.md) are structurally correct (right Tailwind
breakpoints, right grid/flex changes) but haven't been visually confirmed pixel-by-pixel on an
actual phone/tablet/desktop viewport.

## 5. Category-page taxonomy reconciliation

`/ideas/[category]`'s homeowner-facing slugs (`cocinas`, `banos`, ...) and `/results`' contractor
service-vertical taxonomy (`remodeling`, `plumbing`, ...) are two different systems bridged by a
small hand-written map added this pass (`CATEGORY_TO_SERVICE_CATEGORIES`). That map is a
reasonable stopgap, not a long-term design — if the product direction is for these two category
systems to be the same thing, that's a real taxonomy decision (explicitly out of scope for this
pass: "No taxonomy redesign") that should be made deliberately, not accreted through more bridge
maps over time.

## 6. Sponsored/featured placement consistency

Noted but not touched: `FeaturedProfessionals.tsx`'s contractor half always shows a "Featured"
badge (the section is inherently curated) while its agent half only shows it conditionally
(`featuredAgentProfileIds.includes(a.id) || a.southlineStatus === "featured"`). This is a real
inconsistency but touches featured/business logic, not visual polish — left alone per this pass's
"polish, don't change infrastructure or business logic" framing.
