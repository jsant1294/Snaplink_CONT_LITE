# Generated Profile Copy

`lib/professional-intake/generate-copy.ts` — deterministic templates only. Matches the SnapLink source's own approach (its "AI bio" is a synchronous client-side string template, no LLM call — see `00-snaplink-intake-audit.md` item 5), and there is no existing AI infrastructure in this repo for profile-copy generation to reuse, so per the task's own ordering ("deterministic first, AI only if existing infra already supports it") this stays template-only. There is nothing to "fall back" from, so `generateProfileCopy()` always returns synchronously and can never block profile creation on a failed AI call — verified by test 21 (`assert.doesNotThrow`).

## Functions

- `generateSummary` — 1–2 sentences from `idealCustomer` + `customerProblem` + `differentiator` only.
- `generateAbout` — summary + a service-type sentence (from `primaryService`'s taxonomy label) + a service-area sentence.
- `generateServiceAreaSentence`, `generateSeoTitle`, `generateSeoDescription`, `recommendCta` — smaller, single-purpose templates.
- `generateOperatorNotes` — a **separate, operator-only** string compiling `experienceQualifications`, `yearsInBusiness`, `licenseInfo`/`licenseNumber`, and `insuranceCarried`. This is the only function allowed to surface those claims; none of the public-copy functions above ever read them.

## The "never fabricate" rule

Every generated string is built by concatenating literal answer values — there is no inference, no default filler text, and no claim not present in the answer bag. Verified directly: test 19 asserts no generated copy contains "rating"/"review"/"star"; test 20 asserts license/insurance terms never appear in `generateSummary`/`generateAbout` output, only in `generateOperatorNotes`.
