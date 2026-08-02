# Canonical Payment Status Model

`lib/professional-intake-payment/types.ts` defines the one enum every surface (routes, UI, tests) reads:

```ts
export type ProfilePaymentStatus =
  | "not_required" | "payment_required" | "pending" | "paid"
  | "past_due" | "failed" | "refunded" | "comped";

export const PAYMENT_SATISFIED_STATUSES: ProfilePaymentStatus[] = ["not_required", "paid", "comped"];
```

`lib/professional-intake-payment/normalize.ts` is the single normalizer:

- `normalizeProfilePaymentStatus(raw)` — coerces a raw stored value (the manual-override column) into the enum, or `null` if unrecognized. An unrecognized value **fails closed**: callers never treat `null` as satisfied.
- `derivePaymentStatusFromBilling(signal)` — turns the reused billing engine's raw `{ subscriptionStatus: "active"|"canceled", invoiceStatus: "open"|"paid", dueAt }` signals into the canonical enum. That engine has no `failed`/`refunded` concept at all (see `00-current-state-audit.md`), so those two statuses are only ever reachable through a manual override — never derived.

No raw Stripe/subscription/invoice string is ever compared against directly outside these two functions.
