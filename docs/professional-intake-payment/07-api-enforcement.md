# Server-Side Enforcement

Publication eligibility is never "just a disabled button." Two independent server-side checkpoints:

1. **`POST /api/professional-intake/sessions/[id]/publish`** — the dedicated publish action from the review panel. Requires `session.status === "applied"`, loads the billing summary, evaluates eligibility, and returns `409 { error, eligibility, billing }` if blocked — before touching `snaplinkStatus`/`southlineStatus` (verified: the `if (!eligibility.canPublish)` check precedes the write in source order, test 19/20).
2. **`PATCH /api/agent-profiles/[id]`** — the generic, pre-existing agent-edit route every other surface (Agent Management panel, self-service edit) already goes through. Closed the exact gap flagged in the Phase 1 audit ("publication is currently independent of payment"): a request that sets `snaplinkStatus: "published"` or `southlineStatus` to `published`/`featured` now first requires an `applied` + content-approved intake session and passing eligibility, returning `409` otherwise. Tier/module changes are rejected in the same request as a publish request (`400`, "save tier and entitlement changes before publishing") to avoid evaluating eligibility against a stale entitlement snapshot.

Neither route ever echoes a raw Stripe error, an env var, or a stack trace — only the typed `{ error, eligibility, billing }` shape (test: "secrets are never exposed by the payment routes").

**Known gap, not closed by this task**: `POST /api/agent-profiles/create` still allows an operator to create a profile with `snaplinkStatus: "published"` directly at creation time if explicitly requested in the payload. This predates this task and creation flows were out of the explicit Phase list — flagged in `09-next-slice.md`.
