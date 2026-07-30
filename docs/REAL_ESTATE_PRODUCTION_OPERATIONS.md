# SnapLink Real Estate production operations

Phase 6 uses the existing PostgreSQL/Drizzle stack. Apply `drizzle/0005_*.sql`
through the normal reviewed release process; the application never applies it
automatically. Back up first, apply in staging, validate job/webhook/calendar
tables, then promote. The migration is additive and nullable where existing
Phase 5 rows have no new metadata. Rollback is application-first: deploy the
previous commit and leave additive tables/columns intact until a separately
reviewed cleanup migration.

## Configuration

Copy names from `.env.example`; never commit values. Select email with
`REAL_ESTATE_EMAIL_PROVIDER` (`disabled`, `preview`, `resend`, `sendgrid`) and
SMS with `REAL_ESTATE_SMS_PROVIDER` (`disabled`, `preview`, `twilio`).
Production validates the selected adapter’s credentials and sender identity and
does not fail over. Development defaults to preview. Tests force safe behavior.
Set `REAL_ESTATE_PROVIDER_TEST_MODE=true` while validating production wiring
without external delivery.

Resend needs `RESEND_API_KEY`, `REAL_ESTATE_EMAIL_FROM`, and its webhook secret.
SendGrid needs its API key, sender, and Event Webhook verification public key.
Twilio needs account/auth credentials plus a Messaging Service SID (preferred)
or approved phone number. Marketing SMS receives one STOP footer.

Google and Microsoft OAuth require the client ID, client secret, exact HTTPS
redirect URI shown in `.env.example`, and `REAL_ESTATE_TOKEN_ENCRYPTION_KEY`.
Microsoft tenant defaults to `common`; set it explicitly for single-tenant
deployments. Tokens use AES-256-GCM envelopes and remain server-only. Rotate
keys by decrypting with the old version and re-encrypting with the new version
in a reviewed maintenance job before removing the old key.

## Webhooks and jobs

Provider endpoints are:

- `/api/webhooks/real-estate/resend`
- `/api/webhooks/real-estate/sendgrid`
- `/api/webhooks/real-estate/twilio`

Configure their HTTPS URLs at each provider. Signatures, timestamps where
available, replay IDs, and payload hashes are checked before enqueueing.

Schedule `POST /api/internal/real-estate/jobs/process?limit=10` every minute with
`Authorization: Bearer $REAL_ESTATE_JOB_PROCESSOR_SECRET`. Run more frequently
for high-volume campaigns, while keeping batches below 25. Workers use
PostgreSQL `FOR UPDATE SKIP LOCKED`, expiring leases, bounded exponential
backoff, and dead letters. Operators inspect and requeue safe failures at
`/real-estate/settings/jobs`; raw payloads are never displayed.

## Monitoring and recovery

Use `/real-estate/settings/integrations` for safe configuration and queue
status, `/real-estate/calendar/settings` for OAuth connections, and
`/real-estate/analytics/deliverability` for delivery/suppression health.
Provider health checks do not send messages. Test sends require an authorized
operator, explicit confirmation, a consented recipient, and create normal
communication history.

If jobs stall, verify the worker secret and scheduler, inspect the oldest
available job and dead letters, correct the safe failure, then requeue.
Authentication failures require credential rotation. Calendar
`attention_required` means reconnect OAuth. Invalid signatures should trigger
provider endpoint/secret review. Never paste tokens, message bodies, or complete
recipient lists into logs or support tickets.
