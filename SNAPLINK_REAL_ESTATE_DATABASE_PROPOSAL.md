# SnapLink Real Estate — Database Proposal

Status: Phase 1 planning record. Phase 2 implements only
`real_estate_properties` and `real_estate_property_media` through the generated
Drizzle migration. The other tables below remain proposals.

## Principles

- Continue using the existing Drizzle ORM and PostgreSQL/Neon architecture.
- Keep Real Estate tables isolated from contractor tables.
- Require `tenant_id` on every professional record and every tenant-owned query.
- Store public publishing state explicitly; never infer public visibility.
- Preserve stable string IDs and ISO timestamps, matching existing repository conventions.
- Introduce tables only through a reviewed migration in a later phase.

## Proposed tables

### `real_estate_tenants`

`id`, `name`, `slug`, `preferred_language`, `created_at`, `updated_at`

Unique index: `slug`.

### `real_estate_users`

`id`, `tenant_id`, `name`, `email`, `role`, `created_at`, `updated_at`

Indexes: `tenant_id`; unique composite index on `tenant_id, email`.

### `real_estate_agents`

Profile fields from `Agent`, including `tenant_id`, `slug`, `published`, contact
details, biography, languages, service areas, specialties, certifications, and
media URLs.

Indexes: `tenant_id`; unique composite index on `tenant_id, slug`.

### `real_estate_brokerages`

`id`, `tenant_id`, profile/contact fields, office locations, timestamps.

Index: `tenant_id`.

### `real_estate_properties` — implemented in Phase 2

Fields from `Property`, including `tenant_id`, `agent_id`, `slug`, `status`,
`published`, address and pricing fields, property details, JSONB feature and
amenity collections, showing information, media URLs, counters, and timestamps.

Indexes: `tenant_id`; `agent_id`; `status`; `published`; unique composite index
on `tenant_id, slug`. A partial public lookup index on published slugs should be
considered during migration review.

### `real_estate_property_media` — implemented in Phase 2

Tenant-scoped image records linked to properties with a cascading foreign key,
soft deletion, deterministic ordering, hero selection, and future-compatible
media type values.

### `real_estate_leads`

Fields from `RealEstateLead`, including `tenant_id`, optional assignee, client
type, stage, contact information, criteria, source, and activity timestamps.

Indexes: `tenant_id`; `assigned_agent_id`; composite `tenant_id, stage`.

### `real_estate_appointments`

Fields from `Appointment`, including tenant, agent, optional property and lead
references, type, start time, status, and timestamps.

Indexes: `tenant_id`; `agent_id`; `property_id`; composite `tenant_id, starts_at`.

## Deferred tables

Campaigns, marketing assets, QR scan events, reviews, open-house registrations,
teams, permissions overrides, and analytics events remain deferred until their
workflows are approved.

## Repository boundary

The Phase 1 `PropertyRepository` is the initial data-access contract. A future
Drizzle implementation must enforce tenant scope inside every professional
method and published status inside every public method.

## Originally excluded from Phase 1

- Drizzle table declarations
- Migration files
- Database pushes
- Persistent repositories
- CRUD APIs or Server Actions
- Data backfills
