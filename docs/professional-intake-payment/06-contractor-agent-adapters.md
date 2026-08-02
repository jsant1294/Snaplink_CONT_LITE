# Contractor and Agent Billing Adapters

`lib/professional-intake-payment/adapters.ts` — `getProfessionalBillingSummary({ ownerType, ownerId })`, one normalized `ProfessionalBillingSummary` shape, two completely separate internal functions:

- **`contractorBillingSummary()`** — `plan` is always `null` (no tier/plan product exists for contractors, confirmed by the Phase 1 audit). `paymentStatus` comes only from the manual override, defaulting to `not_required`. `planActive`/`entitlementValid` are always `true` — there is no plan or module bundle to be invalid against.
- **`agentBillingSummary()`** — resolves the real tier (`resolveAgentTier`), checks the manual override first, and otherwise derives from `agentSubscriptions()`/`agentInvoices()` (the reused real-estate billing engine, read-only). `entitlementValid` compares the profile's actual `modules` against `computeTierModules(tier)` via `diffTierModules()` — any drift is surfaced, not hidden.

Neither function imports the other's store. `contractorStore` and `agentProfileStore` remain two independent stores — verified by test 30, which also asserts `Contractor` never gains an `AgentProfileTier`-typed field.
