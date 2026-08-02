# Save, Approve, and Publish — Kept Separate

The Objective's flow, implemented exactly as four independent steps that never collapse into one another:

```
Intake received → profile prefilled → operator reviews content
→ operator reviews plan and payment → operator approves → operator saves
→ profile publishes only when payment requirements are satisfied
```

- **Saving a draft** (autosave, `PATCH .../[id]`) works before any payment concept exists — verified by test 17 (the route's source has zero references to payment/eligibility).
- **Applying profile changes** (`POST .../apply`) also never checks payment — verified by test 18. This mirrors the prior professional-intake task's own design: applying is about content correctness, not money.
- **Content approval** is a new, distinct session field (`contentApprovedAt`/`contentApprovedBy`) — it requires the session to already be `applied` (an operator reviewed real profile fields, not just the intake preview), but has no payment dependency itself.
- **Publishing** is the only step gated by the full `evaluateProfilePublicationEligibility()` rule, enforced in two places (the dedicated `/publish` route and the generic agent PATCH route) so there is no way to reach a published state without passing it.

Default intake overwrite mode (`fill_empty`) is unchanged — this task added no new apply-mode logic.
