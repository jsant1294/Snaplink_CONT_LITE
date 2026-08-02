# Conditional Questions — Design Notes

Two independent gates compose (`AND`, not `OR`):

- `ownerTypes` — which identity system (contractor vs. agent) the question is relevant to.
- `professionTypes` — which specific profession(s) within that (or either) identity system.

Some professions exist in both identity systems (`architect`, `interior_designer`, `photographer` can be either a `Contractor.professionType` or an `AgentProfile.professionType`, per `lib/profession-types.ts`'s own comment that "a Southline listing can be a general contractor, an architect, or a realtor from one model"). Their conditional questions (steps 18, 20) deliberately omit `ownerTypes` so they show for either.

Others are identity-bound by the existing product design, not by this feature: contractor trade specifics (step 16) only make sense for `Contractor` rows; brokerage/office/license-state fields (step 17) only make sense for `AgentProfile` rows, because `Contractor` has no `officeName`/`licenseNumber`/`licenseState` fields at all — inventing them would violate the "use real existing field names" rule.

Verified in tests (`tests/professional-intake.test.mjs`, items 5–7): contractor-only questions never leak into an agent session and vice versa; a photographer never sees property-manager questions.
