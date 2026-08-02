# Question Registry

`lib/professional-intake/questions.ts` — `CORE_QUESTIONS` (23 questions across 15 steps) + `CONDITIONAL_QUESTIONS` (23 questions across 5 profession-specific step groups, 16–20).

## Core (steps 1–15)

1. professionType · 2. displayName · 3. companyName · 4. primaryService · 5. additionalServices · 6. serviceAreaCity/State/Zips/serviceRadius (grouped) · 7. idealCustomer · 8. customerProblem · 9. differentiator · 10. experienceQualifications · 11. languages · 12. phone/email/whatsapp/website (grouped) · 13. bookingLink · 14. profilePhoto/coverPhoto/galleryPhotos (grouped) · 15. primaryCta.

Options for `professionType` and `primaryService`/`additionalServices` are pulled live from `PROFESSION_TYPES` + `LICENSED_PROFESSION_TYPES` (`lib/profession-types.ts`) and `HOME_SERVICE_CATEGORIES` (`lib/home-service-taxonomy.ts`) — never a duplicated list.

Required: `professionType`, `displayName`, `primaryService`, `serviceAreaCity`, `serviceAreaState`, `phone`, `primaryCta`. Everything else is optional, matching the spec's "not every field must be filled" intent while still gating the fields a public profile genuinely needs.

## Conditional (steps 16–20)

| Step | Applies to | Questions |
|---|---|---|
| 16 | `ownerTypes: ["contractor"]` (any trade) | yearsInBusiness, licenseInfo, insuranceCarried, estimatesOffered, emergencyService, projectSizeFocus, residentialCommercial, crewSize |
| 17 | `ownerTypes: ["agent"]`, realtor/mortgage/etc. | officeName, teamName, licenseNumber, licenseState, neighborhoodsFocus, buyerSellerSpecialty |
| 18 | `professionTypes: ["architect","interior_designer"]` (either owner type) | projectTypesFocus, designStyle, consultationModel, portfolioSpecialties |
| 19 | `professionTypes: ["property_manager"]` | propertyTypesManaged, unitsManaged, rentalGetawaySpecialization |
| 20 | `professionTypes: ["photographer"]` (either owner type) | sessionTypes, dronePhotography, videoServices, servicePackages |

`getQuestionsFor(ownerType, professionType)` is the single gate function (`questionApplies()` internally): a question shows only if its `ownerTypes` (if set) includes the current owner type AND its `professionTypes` (if set) includes the current profession. No UI or route re-implements this filter — everywhere a question list is needed (autosave normalization, submit validation, the review preview's source-question labels, the wizard UI) calls this one function.
