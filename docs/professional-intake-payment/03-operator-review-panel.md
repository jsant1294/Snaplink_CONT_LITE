# Operator Review Panel

`components/professional-intake/IntakeConsole.tsx`, rendered once a session reaches `status === "applied"`. Operator-only (`isOperator` prop) — the professional-facing wizard steps are unaffected.

`loadGate()` calls `GET .../status` (session + billing summary + eligibility in one round trip) and shows:

- selected plan, payment status (flagged "(manual override)" when applicable),
- amount due / currency, last payment date, next billing date — only when the adapter actually returns them (never fabricated placeholders),
- an entitlement summary: "match the selected plan" or the specific added/removed module drift,
- every blocking reason from `eligibility.reasons`.

Four separate actions, matching the spec's required separation:

| Action | Calls | Gate |
|---|---|---|
| (wizard) Save Draft | `PATCH .../[id]` | none |
| Apply Profile Changes | `POST .../apply` | none |
| Approve reviewed content | `POST .../approval` | session must already be `applied`; disabled once approved |
| Publish profile | `POST .../publish` | `disabled={!gate.eligibility.canPublish}`, and re-enforced server-side |

Saving a manual payment override requires a `window.confirm()` before the request fires, stating plainly that it never charges or touches Stripe.
