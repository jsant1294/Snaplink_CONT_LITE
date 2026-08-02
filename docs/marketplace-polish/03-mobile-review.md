# Mobile Review

## Starting point

Verified via direct grep before touching anything: the marketplace/browse surfaces
(`/results`, `/agents` directory, `FeaturedProfessionals`) already had consistent responsive
breakpoints. The two profile pages — `AgentProfilePublicPage.tsx` and `ContractorPublicPage.tsx`
— had **zero** `sm:`/`md:`/`lg:` classes between them. Both were permanently `max-w-md` (448px),
so "mobile" and "desktop" looked identical: a narrow phone-width column with large empty margins
on a laptop screen. This was the largest gap this pass addressed (High severity, finding #1 in
[00-public-profile-audit.md](./00-public-profile-audit.md)).

## What changed

**This was explicitly a "no desktop redesign" pass** (per the brief) — the goal was making
mobile *usable and consistent*, and letting the existing design breathe at larger sizes, not
inventing new desktop layouts. Every change below is a breakpoint addition on top of the
existing mobile layout, which stays the baseline/default in every case.

- **`AgentProfilePublicPage.tsx`**: container widens `max-w-md → sm:max-w-2xl → lg:max-w-4xl`;
  header goes from stacked/centered to a side-by-side photo+text row at `sm:`; the main content
  reflows into a 5-column grid (`sm:grid-cols-5`) — bio/specialties/languages/service-areas in a
  3-column body, booking/website/save-contact CTAs in a 2-column sidebar — instead of one long
  vertical stack. Below `sm:`, nothing changed — it's the same single-column layout as before.
- **`ContractorPublicPage.tsx`**: same container widening. Primary actions (Request Estimate /
  Upload Photos / campaign CTA) go from a vertical stack to a horizontal row at `sm:`
  (`sm:flex sm:gap-3`). Secondary actions (view services, gallery, reviews, website, walkthrough,
  save contact) go from a stack to a 2-column grid at `sm:`. Services grid gains a third column
  at `md:`; gallery grid gains a fourth at `md:`.
- **Contact button grids** (both pages) keep their existing 3-column mobile layout — already
  correct — and gain slightly more padding (`sm:p-4`) at wider sizes rather than changing
  structure.

## Touch targets

- `ProfessionalCard.tsx`'s two footer CTAs were `py-2` with no explicit minimum height — bumped
  to `py-2.5 min-h-[44px]` with `flex items-center justify-center`, meeting the standard 44px
  minimum tap-target guideline. Added a visible `focus-visible:ring-2` state at the same time
  (previously absent — a keyboard-navigation gap, not just a touch one).
- `/agents` directory card's "View Profile" link got the same `min-h-[44px]` + focus-ring
  treatment.
- Card chips and badges (profession/category/featured pills) were left as-is — they're
  informational, not interactive, so the 44px guideline doesn't apply to them.

## What wasn't touched

Filter pill bars, the `/results` search form, and the homepage's existing responsive sections
were already in good shape (confirmed by audit, not re-verified line-by-line here) and are
outside this pass's actual findings — changing working code without a specific reason would be
scope creep, not polish.
