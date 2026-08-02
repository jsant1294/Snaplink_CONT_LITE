# Professional Card Guidelines

`components/southline/ProfessionalCard.tsx` is the canonical card — used on `/results`, the
primary browsing surface. This document is both a record of what changed and the standard for
any future card work on this site.

## What changed this pass

- **Larger photography**: image band `h-40` (160px) → `h-48` (192px), `sm:h-52` (208px) on wider
  viewports. The photo is the primary visual element; this pass makes it read that way.
- **Category badge**: a new line under the professional's name showing their primary category
  (`pro.categories[0]`, resolved through the real `categoryLabel()` helper in `lib/services.ts`
  — never invented). Sits above the tagline, styled as a small gold uppercase label, distinct
  from the profession badge already shown on the photo.
- **Stronger typography**: name went from `font-display text-xl` to `font-display text-xl
  font-semibold` — more presence without changing the type scale.
- **Touch targets**: both footer CTAs (View Profile / Request Quote or Book) went from `py-2` to
  `py-2.5 min-h-[44px]` with `flex items-center justify-center`, plus a visible focus ring
  (`focus-visible:ring-2 focus-visible:ring-gold`) that wasn't there before.
- **Fallbacks**: unchanged and already solid — `professionPlaceholderPhotoFor()` provides a
  deterministic, profession-appropriate stock photo when `photoUrl` is empty. Not touched because
  it didn't need to be (see [00-public-profile-audit.md](./00-public-profile-audit.md) "what's
  already good").

## What every card on this site should have (standard going forward)

1. A photo — real or the deterministic placeholder, never a blank space or a broken-image icon.
2. A profession badge (what they do) and, where the data supports it, a category badge (what
   vertical they're in) — two different signals, not duplicates of each other.
3. Service area, shown only when the data exists (never a placeholder like "Location unknown").
4. Bilingual labels via `t()` — no inline `lang === "es" ? ... : ...` ternaries in a card
   component.
5. A CTA that meets the 44px minimum touch target and has a visible focus state.
6. No ratings, no reviews, no fabricated trust signals of any kind (see
   [00-public-profile-audit.md](./00-public-profile-audit.md) Phase 3 — none exist anywhere in
   the marketplace today, and this pass confirmed that stays true).

## Known gap: four cards, not one

`ProfessionalCard` is not actually used everywhere a "professional card" appears —
`FeaturedProfessionals.tsx` re-implements the markup twice more, and `/ideas/[category]` and
`/agents` (directory) each have their own bespoke card. This pass brought the two weakest ones
(`/ideas/[category]`, `/agents`) up to visual parity — photo with the same fallback system,
profession badge, 44px CTA — without merging them into `ProfessionalCard` itself, since that
component's prop shape (`ProfessionalResult`) doesn't match what those two pages have on hand
(`Contractor` / public `AgentProfile` directly). Full consolidation into one shared component
usable from any data shape is the natural next step — see
[06-next-slice.md](./06-next-slice.md).
