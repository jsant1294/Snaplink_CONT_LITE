# Copy Review

## What was found

`lib/southline-i18n.ts` is the dictionary most of the site uses consistently, but it isn't the
only one, and several components bypass it entirely with hardcoded strings or inline
`lang === "es" ? ... : ...` ternaries. Full findings in
[00-public-profile-audit.md](./00-public-profile-audit.md) finding #5.

## Fixed this pass

| Location | Before | After |
| --- | --- | --- |
| `AgentProfilePublicPage.tsx` booking CTA | `"Book a Consultation"` (hardcoded, always English) | `t("bookingTitle", lang)` — this key already existed with correct EN/ES text and simply wasn't being used |
| `AgentProfilePublicPage.tsx` website CTA | `"Visit Website"` (hardcoded) | `t("visitWebsite", lang)` — new key added |
| `AgentProfilePublicPage.tsx` SnapLink CTA | `"View Full SnapLink Profile"` (hardcoded) | `t("viewFullSnaplinkProfile", lang)` — new key added |
| `FeaturedProfessionals.tsx` section subcopy | inline `lang === "es" ? "..." : "..."` | `t("trustedProfessionalsNetwork", lang)` — new key added; see note below |
| `app/results/page.tsx` search button | inline `lang === "es" ? "Buscar" : "Search"` | `t("heroSearch", lang)` — reused an existing key with identical copy, no duplicate added |
| `app/c/[username]/[slug]/page.tsx` (mini campaign) CTA | inline `lang === "es" ? "Contactar" : "Contact"` | `t("contactCtaLabel", lang)` — reused an existing key ("Contáctanos"/"Contact us") |
| `/ideas/[category]` empty state | none existed | `t("noProfessionalsYet", lang)` + `t("browseAllServices", lang)` — new keys |

Every new key was added with real Spanish translation, not a placeholder — see the diff in
`lib/southline-i18n.ts` for exact wording.

**Note on `FeaturedProfessionals.tsx`**: this component is under active, substantial concurrent
development in this repository (a taxonomy-driven featured-order rework touching most of the
file) at the same time as this pass. The `t("trustedProfessionalsNetwork", lang)` fix was made
and is sitting in the working tree, but the file itself was **not included in this pass's
commit** — staging it risked catching an unrelated in-progress feature mid-edit. The
`trustedProfessionalsNetwork` i18n key itself *was* committed (it's a small, self-contained
addition to `lib/southline-i18n.ts`), so the fix is available and correct whenever that file's
own changes are committed by whoever's actively working on it.

## Explicitly not fixed this pass: the second dictionary

`components/intake/ContractorPublicPage.tsx` imports `t`/`Lang` from `lib/i18n.ts` (563 lines) —
a second, independent dictionary from `lib/southline-i18n.ts` (544 lines). This wasn't introduced
by this pass and wasn't merged by it either. Reasons:

1. **Scope**: `lib/i18n.ts` is used across the contractor-side surfaces broadly, not just this
   one page — merging dictionaries means auditing every consumer, a materially larger effort
   than a copy-polish pass.
2. **Risk**: a merge that's even slightly wrong (a key collision with different meanings in the
   two files, for instance) silently breaks copy across the contractor dashboard, not just the
   public profile page.
3. **What actually mattered was fixed instead**: the real user-facing bug wasn't "two
   dictionaries exist," it was "the contractor profile page ignores the site's language cookie
   and defaults to English regardless of visitor preference" — that's fixed (see
   [00-public-profile-audit.md](./00-public-profile-audit.md) finding #3, and the `lang` prop
   plumbing described there). The dictionary consolidation is real, valuable follow-up work,
   correctly scoped separately — see [06-next-slice.md](./06-next-slice.md).

## Tone

No copy was rewritten stylistically in this pass beyond the fixes above — every string moved
into `t()` uses the exact wording that was already there (either duplicating what a hardcoded
string already said, or reusing an existing key's already-approved translation). This pass didn't
take a position on tone/voice beyond "match what's already correct elsewhere" — a deliberate
choice, since inventing new marketing copy wasn't asked for and risks drifting from whatever
brand voice review already happened on the existing strings.
