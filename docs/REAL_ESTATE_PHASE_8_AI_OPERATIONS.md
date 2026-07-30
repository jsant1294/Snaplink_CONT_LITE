# Real Estate Phase 8 AI Operations

Phase 8 is an assistive, tenant-scoped drafting and analysis layer. It never publishes a property, accepts an offer, sends a message, mutates a transaction, or makes a housing/credit decision without an explicit authorized human action.

## Provider configuration and safe development

AI is globally disabled unless `REAL_ESTATE_AI_ENABLED=true`. Production live providers require their server-only credential. Test mode always uses the deterministic mock and never calls a live provider. Supported adapters are `disabled`, `mock`, `openai`, and `anthropic`; models are restricted by the allowlist in `lib/real-estate/ai/config.ts`. Provider/model selection is not accepted from clients and there is no silent failover.

See `.env.example` for non-secret settings. Never expose provider credentials through `NEXT_PUBLIC_*`, tenant settings, logs, audit metadata, jobs, prompts, or API responses.

## Tenant controls, usage, and cost

Brokerage owners and administrators can enable individual features, set daily/monthly request limits, per-feature token caps, concurrent-request limits, preferred output language, and retention days. Global disable overrides tenant settings. Usage is checked before enqueue and again before execution. Daily usage rows retain request/token counts and estimated cost in integer micros.

AI requests are durable Phase 6 jobs. Jobs contain identifiers, not authorization scope; execution reloads active membership, derives tenant scope, reloads the source through scoped repositories, and rechecks feature and usage policy. Retry/dead-letter behavior remains owned by the existing job system.

## Prompt and output safety

Prompts are centralized, versioned, hashed, and persisted by key/version. Source data is bounded, redacted, clearly delimited as untrusted, and checked for injection patterns. The application never requests or stores chain-of-thought, full private prompts, raw documents, or raw provider responses. Structured outputs are schema validated.

Fair-housing checks block steering and protected-class preferences in property content. Lead scores use operational engagement signals only; names, preferred language, ZIP codes, and protected attributes do not affect the score. Scores are advisory, explainable, visible, and never hide or reject a lead.

Document extraction is metadata/text-window based and asynchronous. Fields include confidence and source-position references. Low-confidence fields remain review-only. Classification and extracted values are not automatically applied.

## Human review and audit

Review-required outputs enter `/real-estate/ai/review`. Approval, rejection, application, feedback, score overrides, settings changes, request lifecycle, and policy failures create safe audit events. Applying a property description requires an approved, current result, reruns fair-housing checks, updates only description fields, and does not publish.

Task, repair, campaign, and follow-up suggestions are drafts. No communication is sent automatically. Offer comparisons cannot accept or rank by buyer identity. Inspection summaries cannot invent repair costs or create repair requests.

## Health, retention, and monitoring

Health checks submit no tenant data and record provider/model/status/timestamps/latency-safe fields. Operators should alert on sustained degraded/unavailable status, request failure rate, policy blocks, dead letters, limit saturation, latency, and estimated cost.

Retention cleanup is tenant scoped. It removes rejected output after the configured period and clears provider request identifiers while preserving source records, approved/applied history, audit events, and aggregate usage. Legal retention exceptions must be handled before cleanup is scheduled.

## Migration, rollout, and rollback

Migration `drizzle/0007_condemned_apocalypse.sql` is additive and is generated but not automatically applied.

Backfill: none is required. Existing tenants remain effectively disabled until global configuration and tenant feature settings permit use. Prompt-version rows are created from the code registry on first use.

Rollout:

1. Apply the reviewed migration through the normal production migration workflow.
2. Configure one provider and allowlisted model with server-only credentials.
3. Keep global AI disabled while verifying health and job workers.
4. Enable a low-risk feature for an internal tenant with low limits.
5. Review outputs, fair-housing blocks, usage, costs, and audit events.
6. Expand per tenant and feature.

Rollback: set `REAL_ESTATE_AI_ENABLED=false` first, stop AI job intake, allow or cancel in-flight AI jobs, and deploy the prior application. Preserve the additive tables for audit/history. A later reviewed migration may remove them only after retention/export obligations are satisfied; do not drop them during an incident rollback.

## Known limitations

No MLS, mortgage, legal-advice, autonomous tool execution, vector search, OCR pipeline, automatic publishing, automatic offer action, or automatic communication sending is included. Market insights are labeled as internal SnapLink data and are not a market-wide representation. Provider health is a minimal configuration-state probe until a private-data-free scheduled live probe is approved.
