# Publication Eligibility

One function, `evaluateProfilePublicationEligibility()` (`lib/professional-intake-payment/eligibility.ts`), used identically by:

- the operator review UI (`IntakeConsole.tsx`, to disable the Publish button and list reasons),
- the dedicated publish route (`app/api/professional-intake/sessions/[id]/publish/route.ts`),
- the generic agent PATCH route (`app/api/agent-profiles/[id]/route.ts`), which can also set `snaplinkStatus`/`southlineStatus` to published and must not be a second way to bypass the gate,
- the status/summary route (`.../status/route.ts`), for display only.

```ts
canPublish = profileApproved && planActive && entitlementValid && paymentSatisfied
paymentSatisfied = ["not_required", "paid", "comped"].includes(paymentStatus)
```

Every failing input contributes one bilingual, human-readable reason string to `reasons[]` — never a raw status code. Verified by tests 6–16 (each input isolated, plus a combinatorial "only true when everything passes" check) and 31/32 (EN/ES reason text).
