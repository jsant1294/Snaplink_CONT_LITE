# Readiness Model

`not_connected` means no connected account. `incomplete` means an account exists but details are not submitted. `restricted` means details are submitted but requirements, charges, or payouts are not ready. `ready` requires `details_submitted`, `charges_enabled`, and `payouts_enabled` to all be true.

The persisted fields are `stripeDetailsSubmitted`, `stripeChargesEnabled`, `stripePayoutsEnabled`, `stripeRequirementsCurrentlyDue`, `stripeDisabledReason`, `stripeLastSyncedAt`, and `stripeConnectStatus`. The legacy `stripeOnboardingComplete` flag mirrors only `ready`.
