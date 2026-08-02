# Manual Payment and Complimentary Access

New columns on both `contractors` and `agent_profiles`: `manual_payment_status`, `manual_payment_note`, `manual_payment_set_at`, `manual_payment_set_by`. An internal administrative record only.

`lib/professional-intake-payment/manual-override.ts`:

- `isValidManualPaymentStatus(value)` — validates against the canonical enum before anything is persisted.
- `setManualPaymentStatus(ownerType, ownerId, status, note, setBy)` — always stamps `setAt`/`setBy` on every write (a dedicated `setManualPayment()` store method per owner type, not the generic `update()`, so "clear the override" — `status: null` — is unambiguous in both JSON and Postgres modes).

`PATCH .../sessions/[id]/payment` (operator-only) is the one route that writes it, and the UI requires an explicit `window.confirm()` before calling it (test 26). Verified never to import or call Stripe or the reused real-estate billing engine (test 27) — setting a profile to "comped" is purely a local status flag; it neither charges nor refunds anything.

When a manual override is present, it always takes precedence over the derived subscription/invoice status (`adapters.ts`) — an operator's explicit judgment call overrides the automated derivation.
