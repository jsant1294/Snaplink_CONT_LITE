# Real Estate Phase 7 Operations

Phase 7 adds transaction operations, client portal access, private documents, offers, inspections, escrow tracking, messaging, commission estimates, reports, and append-only audit events. It does not move funds, calculate payroll, provide an accounting ledger, or expose commission data to portal clients.

## Migration

Apply `drizzle/0006_amazing_warbound.sql` through the existing controlled migration process. The application does not apply the migration automatically. Back up the target database and verify that migrations 0000–0005 are present first.

## Private documents

`BLOB_READ_WRITE_TOKEN` must reference a Vercel Blob store that supports private access. Uploads are restricted to the MIME allowlist and 20 MB. Development marks accepted files clean so local workflows can be exercised. Production marks uploads pending until a malware scanner implementation changes their version status to `clean`; pending or failed versions cannot be downloaded.

Document downloads are streamed through an authorized Node route and use `Cache-Control: private, no-store`. Blob URLs are never returned to clients.

## Portal security

Portal access is invitation-only and separate from professional PIN authentication. Invitation and session tokens are random, hashed at rest, expiring, revocable, and transaction-scoped. The secure cookie is HTTP-only, SameSite=Lax, and Secure in production. Invitation and public share attempts are rate-limited. Invalid, expired, revoked, and exhausted share links return the same generic response.

Portal grants must be revoked when a client should lose access. Revoking a grant takes effect on the next request. Revoking a portal session logs that device out.

## Jobs and calendars

The Phase 6 durable queue now recognizes transaction milestone reminders, offer expiration, portal notification delivery, document scanning, and document-request reminders. Inspection and transaction-milestone calendar records use the existing encrypted provider connections. Production workers continue to require `REAL_ESTATE_JOB_PROCESSOR_SECRET`.

## Validation

Run:

```bash
npm run test:real-estate
npx tsc --noEmit
npm run build
git diff --check
```

Database integration tests require an isolated, migrated `REAL_ESTATE_TEST_DATABASE_URL`. They refuse to run against `DATABASE_URL`.
