# Phase 9 Enterprise Operations

Phase 9 adds enterprise hierarchy and external integration infrastructure without changing contractor, consumer, membership, AI, portal, document, messaging, commission, or audit contracts.

## Organization hierarchy

The supported hierarchy is franchise → region → brokerage → office → team. Nodes and assignments always carry tenant scope. Enterprise assignments may inherit to descendants, but they supplement rather than replace the existing membership permission and source-record ownership checks. Resource-to-node mappings support indexed office/team reporting without adding organization fields to earlier domain tables.

## Public API v1

The versioned root is `/api/v1`. Responses include `X-SnapLink-API-Version: 2026-07-01`, opaque external IDs, cursor pagination, bounded page sizes, allowlisted sorting and sparse fieldsets, and a standard error envelope. The OpenAPI document is available at `/api/v1/openapi.json` and in `docs/openapi/snaplink-real-estate-v1.json`.

API keys are shown once, stored only as SHA-256 hashes, scope restricted, optionally IP allowlisted, rate limited, monthly quota constrained, expiring, revocable, and audited. Clients cannot submit tenant or model scope. Key rotation means create a replacement, deploy it to the consumer, confirm traffic, then revoke the old key.

The TypeScript client foundation is in `sdk/typescript/index.ts`. It intentionally has no bundled credential storage.

## OAuth

Trusted applications use registered exact HTTPS redirect URIs. Authorization codes are hashed, five-minute, and single use. Access and refresh values are hashed; refresh grants share a family identifier so rotation/reuse response and family revocation can be extended without changing the schema. OAuth client secrets are displayed only at registration. Production authorization UI and third-party review remain required before general marketplace availability.

## Outbound webhooks

Subscriptions support transaction created/updated, offer accepted, closing completed, document uploaded, portal invitation, and AI review completed. Delivery bodies are signed as `HMAC-SHA256(timestamp + "." + rawBody)`, carry a five-minute replay window expectation, use durable jobs, and retain delivery status, attempt count, safe error, and response status. Consumers must verify the timestamp and signature before parsing or acting.

## Imports and exports

CSV and JSON transfer records support leads, contacts, properties, and transactions. Jobs retain validation-preview counts, duplicate counts, row cursor, mapping, safe row errors, idempotency key, and Blob reference so processing can resume. Uploaded content must use the existing private Blob path and be scanned/validated before mutation. Import preview never mutates domain records.

## Search, reporting, and observability

Unified search is tenant and organization scoped across property address/title, contacts, transactions, document metadata, and notes. Query lengths and result groups are bounded. Enterprise reports aggregate hierarchy, closing/volume, conversion, AI usage, and cost; resource-node mappings support office/team rollups.

Operational metrics cover API latency, job latency, queue depth, webhook health, AI/provider health, errors, and slow-query counts. Metric dimensions must remain low cardinality and never contain contacts, document content, credentials, raw URLs, or internal payloads.

## Disaster recovery

Backup verification records store a hash of the backup reference, database/blob/integrity status, safe findings, verifier, and timestamp. They do not restore data. Production restore remains a separately approved operator procedure:

1. Declare an incident and freeze writes.
2. Identify a tested restore point and verify checksums.
3. Restore into an isolated environment.
4. Run schema, tenant-count, Blob-reference, and sample authorization checks.
5. Obtain incident-commander approval.
6. Cut over using the infrastructure runbook.
7. Reconcile jobs/webhooks and rotate exposed credentials.

## Migration and rollout

`drizzle/0008_salty_santa_claus.sql` is additive and must not be applied automatically. No backfill is required. Existing records receive opaque public IDs lazily when first exposed through the API. Roll out hierarchy first, then internal API clients at low quotas, webhook canaries, import previews, and finally enterprise reporting.

Rollback is application-first: revoke/disable API keys, OAuth clients and webhook subscriptions; stop Phase 9 job intake; deploy the prior application; retain Phase 9 tables for audit and delivery reconciliation. Do not drop tables during an incident.

## Scaling guidance and known limits

Use PgBouncer/managed pooling, monitor cursor-query indexes, partition high-volume metric/delivery history when needed, bound job batches, and scale workers independently from web traffic. Current search uses indexed relational fields and bounded queries, not an external search cluster. OAuth consent UI, refresh exchange endpoint, automated production restore, marketplace billing, and load-test execution against production are intentionally excluded.
