# 08 — Next Slice (recommended, NOT implemented)

Status: Phase 13 — recommendations only.

These are the natural follow-ups. None are implemented in this slice; each is
display/UI or content work, not identity work.

## Recommended next slice: "Southline professional discovery surfaces"

1. **Swap `/results` chips to the taxonomy.** Replace the `SERVICE_CATEGORIES` chip
   source with `listSouthlineHomeServices({ audience: "both" })` so professional
   categories (Realtor, Photography, etc.) appear as filters. Display-only; routing
   contract (`/results?category=`) is unchanged. Requires updating the
   `/results page uses the shared search lib` test assertion.
2. **Feed homepage "Home Services" from the adapter.** Replace/augment the
   `HomeServicesContent` default with `listSouthlineHomeServices({ locale })` output.
3. **Featured curation.** Today no category is `featured`; wire the flag to a CMS field
   so Southline can spotlight categories without touching code.

## Smaller candidates

4. **Expand empty groups** (`cleaning`, `pest-environmental`, `moving-storage`,
   `security-smart-home`, `accessibility-senior`, `rentals-getaways`, `exterior`) as
   real categories become available — each with a `PROFESSION_CATEGORY_MAP` entry.
5. **CMS read/write for categories** — see `09-cms-readiness.md`.
6. **Specialty-level search chips** for agents (agent `specialties[]` are free text; a
   structured picker backed by `HOME_SERVICE_SPECIALTIES` would improve precision).
7. **Fix the 6 pre-existing LFC baseline tests** by rebasing the `git diff` baselines in
   the six affected test files to a commit after the Money-module routes landed.

## Deliberately out of scope (hard boundaries)

- No `professional_profiles`, no second identity table, no canonical sync layer.
- No dashboard merge; agents and contractors keep separate dashboards and profiles.
- No changes to billing/booking, Rentals & Getaways, or SnapLink Local ownership.
