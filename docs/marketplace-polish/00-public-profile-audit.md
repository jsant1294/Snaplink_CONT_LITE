# Public Profile & Marketplace Audit

Scope: every public-facing surface a homeowner sees — profile pages, marketplace cards,
category browsing. Admin/CMS surfaces are out of scope. Findings are grounded in direct file
reads, not assumptions; file:line references are given so each item can be re-verified.

Surfaces covered:
- `app/agents/[slug]/page.tsx` + `app/p/[username]/page.tsx` → `components/agent-profiles/AgentProfilePublicPage.tsx`
- `app/contractor/[username]/page.tsx` → `components/intake/ContractorPublicPage.tsx`
- `components/southline/ProfessionalCard.tsx` (canonical card, used on `/results`)
- `components/southline/FeaturedProfessionals.tsx` (two more bespoke card implementations)
- `app/ideas/[category]/page.tsx` (a third bespoke card + category browsing)
- `app/agents/page.tsx` (agent directory, a fourth bespoke card)
- `app/results/page.tsx` (primary category/search browsing surface)

## Critical

None found. Nothing is broken in the sense of a crash, a dead route, or content that's
factually wrong for the visitor — the issues below are real quality/consistency gaps, not
outages.

## High

1. **Agent and contractor profile pages have zero responsive breakpoints.**
   `AgentProfilePublicPage.tsx` and `ContractorPublicPage.tsx` are both hard-locked to
   `max-w-md mx-auto` (448px) with no `sm:`/`md:`/`lg:` classes anywhere in either file
   (confirmed via grep — zero matches). Every desktop and tablet visitor — the majority of
   traffic clicking through from a marketplace card on a laptop — sees a narrow, centered phone
   column with large empty margins on both sides. This is the single most visible "this wasn't
   designed for desktop" gap on the two pages homeowners spend the most time on.

2. **`/ideas/[category]` shows the same six contractors on every category page, regardless of
   category.** `app/ideas/[category]/page.tsx:113` — `contractors.slice(0, 6)` with no filtering
   at all. `/ideas/cocinas` (Kitchens) and `/ideas/garajes` (Garages) render an identical
   contractor list. This directly contradicts the section's own heading
   (`t("featuredTitle", lang)` under a page titled by category) and actively misleads a homeowner
   who assumes the professionals shown specialize in what they're browsing.

3. **Contractor profile pages ignore the site's language cookie entirely.**
   `components/intake/ContractorPublicPage.tsx` holds its own `useState<Lang>("en")` and is never
   passed a `lang` prop by `app/contractor/[username]/page.tsx`, even though that page already
   resolves the real `sl_lang` cookie for its own metadata. Every visitor — including Spanish-
   preferring ones who set the cookie via the language toggle everywhere else on the site — lands
   on an English-default contractor profile, and the in-page toggle resets on every reload. This
   is the single biggest bilingual-consistency gap on the site.

## Medium

4. **Agent profile pages show no image at all when `photoUrl` is missing** —
   `AgentProfilePublicPage.tsx:53`, `{profile.photoUrl && <img .../>}`. The marketplace card that
   linked to this same profile (`ProfessionalCard.tsx:13-15`) always shows a deterministic stock
   placeholder photo via `professionPlaceholderPhotoFor`. A homeowner who clicks a card with a
   photo can land on a profile with a blank header — a visible mismatch, not a broken-image icon,
   but a missed-photo one.

5. **Two parallel bilingual dictionaries exist** (`lib/southline-i18n.ts`, 544 lines, used by
   most of the site, and `lib/i18n.ts`, 563 lines, used only by `ContractorPublicPage.tsx`), plus
   several components bypass both with inline `lang === "es" ? ... : ...` ternaries or flatly
   hardcoded English:
   - `AgentProfilePublicPage.tsx:122,127,132` — "Book a Consultation" (a translation already
     exists, `t("bookingTitle", lang)`, and simply isn't used here), "Visit Website", "View Full
     SnapLink Profile" — all permanently English regardless of `lang`.
   - `FeaturedProfessionals.tsx:85-88`, `app/results/page.tsx:76`,
     `app/c/[username]/[slug]/page.tsx:85` — inline ternaries instead of `t()` keys.
   - Full dictionary consolidation is a larger, separate effort (touches every contractor-side
     surface using `lib/i18n.ts`) and is **out of scope for this pass** — see
     [06-next-slice.md](./06-next-slice.md). The specific hardcoded strings above were fixed in
     this pass since they're small, isolated, and don't require touching the second dictionary.

6. **Four independent, hand-duplicated "professional card" layouts** instead of one shared
   component: the canonical `ProfessionalCard.tsx` (used only on `/results`),
   `FeaturedProfessionals.tsx` (reimplements the card markup twice more, once per identity type,
   with an inconsistency where the contractor half always shows "Featured" but the agent half is
   conditional), a bare text-link card in `app/ideas/[category]/page.tsx` with no photo or badge,
   and another bare card in `app/agents/page.tsx` with no photo either. A visual change to one
   never propagates to the others. Full consolidation into one shared component is a larger
   refactor — **out of scope for this pass** (see [06-next-slice.md](./06-next-slice.md)); this
   pass instead brings the two weakest cards (`/ideas/[category]`, `/agents` directory) up to
   visual parity by adding the same photo-fallback and badge treatment, without merging the
   components.

## Low

7. **Agent profiles have no gallery/portfolio section.** `AgentProfile`
   (`lib/agent-profiles/types.ts`) has no `galleryUrl`/`galleryUrls` field, unlike `Contractor`,
   which has both and renders a real gallery grid (`ContractorPublicPage.tsx`). Adding this needs
   a new schema field, which is infrastructure work explicitly out of scope for a polish pass
   (see [06-next-slice.md](./06-next-slice.md)).

8. **`/ideas/[category]` has no "back to all categories/services" navigation** beyond a single
   breadcrumb crumb to Home — no link to `/results` or a categories index once you're inside one
   category's page.

## What's already good (verified, not assumed)

- **No fabricated trust signals anywhere.** Grepped explicitly for ratings/reviews/stars across
  every surface in scope — none exist. `ProfessionalCard.tsx` shows only real fields: profession
  badge, service area, service chips, a real `featured` boolean, and a real Spanish-speaker badge
  driven by `preferredLanguage`. Phase 3 of this pass requires nothing further here.
- **The card-photo fallback system is genuinely well-built where it's used**:
  `professionPlaceholderPhotoFor(id, professionType)` (`lib/profession-types.ts`) is
  deterministic (same pro always gets the same stock photo) and de-duplicates within a single
  render (`FeaturedProfessionals.tsx`'s `assignCardPhotos`) so two same-profession cards never
  show an identical placeholder. The gap (finding 4 above) is that this system isn't applied
  everywhere a photo could be missing, not that the system itself is weak.
- **`/results` is the strongest surface on the site**: responsive grid, real empty state that
  distinguishes "no category matches" from "no search results," a working pill filter bar driven
  by the shared taxonomy, and it already uses `ProfessionalCard` rather than a bespoke card.

## Severity summary for this pass

| Finding | Severity | Addressed this pass? |
| --- | --- | --- |
| 1. Profile pages not responsive | High | Yes |
| 2. `/ideas/[category]` contractor filtering ignored | High | Yes |
| 3. Contractor profile ignores language cookie | High | Yes |
| 4. Agent profile photo fallback missing | Medium | Yes |
| 5. Hardcoded/ternary copy bypassing i18n | Medium | Partially — isolated strings fixed, dictionary merge deferred |
| 6. Four duplicated card layouts | Medium | Partially — worst two brought to visual parity, full consolidation deferred |
| 7. No agent gallery | Low | Deferred (needs a schema field) |
| 8. No back-to-categories nav on `/ideas/[category]` | Low | Yes |
