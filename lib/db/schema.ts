// ---------------------------------------------------------------------------
// Drizzle schema — production persistence (Neon Postgres or any Postgres).
// Mirrors lib/types.ts 1:1. Photos live in their own table; on Vercel with
// BLOB_READ_WRITE_TOKEN set, photo payloads are uploaded to Vercel Blob and
// only the URL is stored here.
// ---------------------------------------------------------------------------

import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

export const contractors = pgTable(
  "contractors",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    pin: text("pin"),
    preferredLanguage: text("preferred_language").notNull().default("en"),
    businessName: text("business_name").notNull(),
    ownerName: text("owner_name").notNull().default(""),
    phone: text("phone").notNull(),
    whatsapp: text("whatsapp"),
    email: text("email").notNull().default(""),
    serviceArea: text("service_area").notNull().default(""),
    services: jsonb("services").$type<string[]>().notNull().default([]),
    payments: jsonb("payments"),
    tagline: text("tagline"),
    licenseInfo: text("license_info"),
    reviewsUrl: text("reviews_url"),
    galleryUrl: text("gallery_url"),
    brandColor: text("brand_color"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("contractors_username_idx").on(t.username)]
);

export const leads = pgTable(
  "leads",
  {
    id: text("id").primaryKey(),
    contractorId: text("contractor_id").notNull(),
    contractorUsername: text("contractor_username").notNull(),
    source: text("source").notNull().default("link"),
    status: text("status").notNull().default("New"),
    language: text("language").notNull().default("en"),
    clientName: text("client_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull().default(""),
    projectAddress: text("project_address").notNull().default(""),
    preferredContact: text("preferred_contact").notNull().default("Text"),
    bestTimeToContact: text("best_time_to_contact").notNull().default(""),
    projectType: text("project_type").notNull(),
    timeline: text("timeline").notNull().default(""),
    budgetRange: text("budget_range").notNull().default(""),
    notes: text("notes").notNull().default(""),
    answers: jsonb("answers").$type<Record<string, string>>().notNull().default({}),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    ai: jsonb("ai"),
    payments: jsonb("payments").$type<unknown[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("leads_contractor_idx").on(t.contractorUsername)]
);

export const photos = pgTable(
  "photos",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id").notNull(),
    kind: text("kind").notNull().default("other"),
    /** Vercel Blob URL in production, or a data URL fallback. */
    dataUrl: text("data_url").notNull(),
    filename: text("filename").notNull().default("photo.jpg"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("photos_lead_idx").on(t.leadId)]
);

export const estimates = pgTable(
  "estimates",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id").notNull(),
    contractorId: text("contractor_id").notNull(),
    status: text("status").notNull().default("draft"),
    lineItems: jsonb("line_items").notNull().default([]),
    taxRate: real("tax_rate").notNull().default(0),
    discount: real("discount").notNull().default(0),
    depositPercent: real("deposit_percent").notNull().default(0),
    notes: text("notes").notNull().default(""),
    validDays: integer("valid_days").notNull().default(30),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("estimates_lead_idx").on(t.leadId)]
);

// ---------------------------------------------------------------------------
// SnapLink Real Estate — Phase 2 property management.
//
// Tenant/organization/brokerage/agent parent tables are intentionally not
// part of this migration. Their IDs are indexed relationship fields until
// those approved modules introduce the owning tables. Property media has a
// real FK because its parent exists in this migration.
// ---------------------------------------------------------------------------

export const realEstateProperties = pgTable(
  "real_estate_properties",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    organizationId: text("organization_id").notNull(),
    brokerageId: text("brokerage_id").notNull(),
    listingAgentId: text("listing_agent_id").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    propertyType: text("property_type").notNull(),
    propertyStatus: text("property_status").notNull().default("draft"),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull().default("US"),
    priceCents: integer("price_cents").notNull().default(0),
    bedrooms: real("bedrooms").notNull().default(0),
    bathrooms: real("bathrooms").notNull().default(0),
    squareFeet: integer("square_feet").notNull().default(0),
    lotSize: text("lot_size"),
    yearBuilt: integer("year_built"),
    shortDescription: text("short_description").notNull().default(""),
    description: text("description").notNull().default(""),
    amenities: jsonb("amenities").$type<string[]>().notNull().default([]),
    features: jsonb("features").$type<string[]>().notNull().default([]),
    heroImage: text("hero_image"),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "string" }),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [
    unique("real_estate_properties_tenant_slug_unique").on(t.tenantId, t.slug),
    index("real_estate_properties_tenant_idx").on(t.tenantId),
    index("real_estate_properties_org_idx").on(t.organizationId),
    index("real_estate_properties_brokerage_idx").on(t.brokerageId),
    index("real_estate_properties_agent_idx").on(t.listingAgentId),
    index("real_estate_properties_published_idx").on(t.isPublished),
    index("real_estate_properties_status_idx").on(t.propertyStatus),
    index("real_estate_properties_deleted_idx").on(t.deletedAt),
  ]
);

export const realEstatePropertyMedia = pgTable(
  "real_estate_property_media",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id").notNull().references(() => realEstateProperties.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").notNull(),
    mediaType: text("media_type").notNull().default("image"),
    url: text("url").notNull(),
    filename: text("filename").notNull().default("property-image.jpg"),
    altText: text("alt_text").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isHero: boolean("is_hero").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [
    index("real_estate_property_media_property_idx").on(t.propertyId),
    index("real_estate_property_media_tenant_idx").on(t.tenantId),
    index("real_estate_property_media_sort_idx").on(t.propertyId, t.sortOrder),
    index("real_estate_property_media_deleted_idx").on(t.deletedAt),
  ]
);

export const realEstateBrokerages = pgTable(
  "real_estate_brokerages",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    logoUrl: text("logo_url"),
    description: text("description").notNull().default(""),
    addressLine1: text("address_line_1").notNull().default(""),
    addressLine2: text("address_line_2"),
    city: text("city").notNull().default(""),
    state: text("state").notNull().default(""),
    postalCode: text("postal_code").notNull().default(""),
    country: text("country").notNull().default("US"),
    phone: text("phone").notNull().default(""),
    email: text("email").notNull().default(""),
    website: text("website"),
    brandColor: text("brand_color"),
    serviceAreas: jsonb("service_areas").$type<string[]>().notNull().default([]),
    socialLinks: jsonb("social_links").$type<Record<string, string>>().notNull().default({}),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [
    index("real_estate_brokerages_tenant_idx").on(t.tenantId),
    index("real_estate_brokerages_org_idx").on(t.organizationId),
    unique("real_estate_brokerages_tenant_name_unique").on(t.tenantId, t.name),
  ]
);

export const realEstateAgents = pgTable(
  "real_estate_agents",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    organizationId: text("organization_id").notNull(),
    brokerageId: text("brokerage_id").notNull().references(() => realEstateBrokerages.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    photoUrl: text("photo_url"),
    biography: text("biography").notNull().default(""),
    licenseNumber: text("license_number").notNull().default(""),
    licenseState: text("license_state").notNull().default(""),
    specialties: jsonb("specialties").$type<string[]>().notNull().default([]),
    serviceAreas: jsonb("service_areas").$type<string[]>().notNull().default([]),
    languages: jsonb("languages").$type<string[]>().notNull().default([]),
    certifications: jsonb("certifications").$type<string[]>().notNull().default([]),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [
    index("real_estate_agents_tenant_idx").on(t.tenantId),
    index("real_estate_agents_brokerage_idx").on(t.brokerageId),
    unique("real_estate_agents_tenant_email_unique").on(t.tenantId, t.email),
  ]
);

export const realEstateBuyers = pgTable(
  "real_estate_buyers",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    assignedAgentId: text("assigned_agent_id").references(() => realEstateAgents.id),
    name: text("name").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    budgetMinCents: integer("budget_min_cents"),
    budgetMaxCents: integer("budget_max_cents"),
    preferredCities: jsonb("preferred_cities").$type<string[]>().notNull().default([]),
    bedrooms: real("bedrooms"),
    bathrooms: real("bathrooms"),
    propertyTypes: jsonb("property_types").$type<string[]>().notNull().default([]),
    financingStatus: text("financing_status").notNull().default("unknown"),
    pipelineStage: text("pipeline_stage").notNull().default("new"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [index("real_estate_buyers_tenant_idx").on(t.tenantId), index("real_estate_buyers_agent_idx").on(t.assignedAgentId)]
);

export const realEstateSellers = pgTable(
  "real_estate_sellers",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    assignedAgentId: text("assigned_agent_id").references(() => realEstateAgents.id),
    ownerName: text("owner_name").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    propertyAddress: text("property_address").notNull(),
    timeline: text("timeline").notNull().default(""),
    askingExpectationCents: integer("asking_expectation_cents"),
    repairs: text("repairs").notNull().default(""),
    mortgageEstimateCents: integer("mortgage_estimate_cents"),
    pipelineStage: text("pipeline_stage").notNull().default("new"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [index("real_estate_sellers_tenant_idx").on(t.tenantId), index("real_estate_sellers_agent_idx").on(t.assignedAgentId)]
);

export const realEstateLeads = pgTable(
  "real_estate_leads",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    assignedAgentId: text("assigned_agent_id").references(() => realEstateAgents.id),
    buyerId: text("buyer_id").references(() => realEstateBuyers.id),
    sellerId: text("seller_id").references(() => realEstateSellers.id),
    leadType: text("lead_type").notNull().default("general"),
    stage: text("stage").notNull().default("new"),
    name: text("name").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    source: text("source").notNull().default("manual"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [
    index("real_estate_leads_tenant_idx").on(t.tenantId),
    index("real_estate_leads_agent_idx").on(t.assignedAgentId),
    index("real_estate_leads_stage_idx").on(t.tenantId, t.stage),
  ]
);

export const realEstateShowings = pgTable(
  "real_estate_showings",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    propertyId: text("property_id").notNull().references(() => realEstateProperties.id),
    buyerId: text("buyer_id").references(() => realEstateBuyers.id),
    assignedAgentId: text("assigned_agent_id").notNull().references(() => realEstateAgents.id),
    requestedAt: timestamp("requested_at", { withTimezone: true, mode: "string" }).notNull(),
    status: text("status").notNull().default("requested"),
    isApproved: boolean("is_approved").notNull().default(false),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [index("real_estate_showings_tenant_idx").on(t.tenantId), index("real_estate_showings_date_idx").on(t.tenantId, t.requestedAt)]
);

export const realEstateOpenHouses = pgTable(
  "real_estate_open_houses",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    propertyId: text("property_id").notNull().references(() => realEstateProperties.id),
    assignedAgentId: text("assigned_agent_id").notNull().references(() => realEstateAgents.id),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "string" }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "string" }).notNull(),
    attendeeCount: integer("attendee_count").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(false),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [index("real_estate_open_houses_tenant_idx").on(t.tenantId), index("real_estate_open_houses_date_idx").on(t.tenantId, t.startsAt)]
);

export const realEstateActivities = pgTable(
  "real_estate_activities",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    actorId: text("actor_id"),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    description: text("description").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => [index("real_estate_activities_tenant_idx").on(t.tenantId), index("real_estate_activities_entity_idx").on(t.entityType, t.entityId)]
);

export const realEstateTasks = pgTable(
  "real_estate_tasks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    assignedAgentId: text("assigned_agent_id").references(() => realEstateAgents.id),
    title: text("title").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true, mode: "string" }),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [index("real_estate_tasks_tenant_idx").on(t.tenantId), index("real_estate_tasks_agent_idx").on(t.assignedAgentId)]
);

export const realEstateMemberships = pgTable(
  "real_estate_memberships",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    userEmail: text("user_email").notNull(),
    role: text("role").notNull(),
    agentId: text("agent_id").references(() => realEstateAgents.id),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [
    unique("real_estate_memberships_tenant_email_unique").on(t.tenantId, t.userEmail),
    index("real_estate_memberships_tenant_idx").on(t.tenantId),
    index("real_estate_memberships_agent_idx").on(t.agentId),
  ]
);

export const realEstateOpenHouseAttendees = pgTable(
  "real_estate_open_house_attendees",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    openHouseId: text("open_house_id").notNull().references(() => realEstateOpenHouses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    workingWithRealtor: boolean("working_with_realtor").notNull().default(false),
    preApproved: boolean("pre_approved").notNull().default(false),
    budget: text("budget").notNull().default(""),
    timeline: text("timeline").notNull().default(""),
    notes: text("notes").notNull().default(""),
    consent: boolean("consent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => [index("real_estate_attendees_tenant_idx").on(t.tenantId), index("real_estate_attendees_open_house_idx").on(t.openHouseId)]
);

export const realEstateReminders = pgTable(
  "real_estate_reminders",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    assignedAgentId: text("assigned_agent_id").references(() => realEstateAgents.id),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    title: text("title").notNull(),
    remindAt: timestamp("remind_at", { withTimezone: true, mode: "string" }).notNull(),
    status: text("status").notNull().default("scheduled"),
    channels: jsonb("channels").$type<string[]>().notNull().default(["in_app"]),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),
    dedupeKey: text("dedupe_key"),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [index("real_estate_reminders_tenant_date_idx").on(t.tenantId, t.remindAt), index("real_estate_reminders_agent_idx").on(t.assignedAgentId), unique("real_estate_reminders_dedupe_unique").on(t.tenantId, t.dedupeKey)]
);

export const realEstateCalendarConnections = pgTable(
  "real_estate_calendar_connections",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    memberId: text("member_id").notNull().references(() => realEstateMemberships.id),
    provider: text("provider").notNull(),
    externalCalendarId: text("external_calendar_id"),
    syncEnabled: boolean("sync_enabled").notNull().default(false),
    status: text("status").notNull().default("disconnected"),
    syncDirection: text("sync_direction").notNull().default("outbound"),
    timezone: text("timezone").notNull().default("America/New_York"),
    encryptionVersion: integer("encryption_version"),
    attentionRequired: boolean("attention_required").notNull().default(false),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    accessTokenEncrypted: text("access_token_encrypted"),
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true, mode: "string" }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [unique("real_estate_calendar_member_provider_unique").on(t.memberId, t.provider), index("real_estate_calendar_tenant_idx").on(t.tenantId)]
);

export const realEstateCommunications = pgTable(
  "real_estate_communications",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    senderMembershipId: text("sender_membership_id").references(() => realEstateMemberships.id),
    sender: text("sender"),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    channel: text("channel").notNull(),
    recipient: text("recipient").notNull(),
    provider: text("provider").notNull().default("disabled"),
    idempotencyKey: text("idempotency_key"),
    templateId: text("template_id"),
    subject: text("subject"),
    body: text("body").notNull(),
    renderedContent: jsonb("rendered_content").$type<Record<string, unknown>>().notNull().default({}),
    status: text("status").notNull().default("queued"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: "string" }),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "string" }),
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    propertyId: text("property_id"),
    leadId: text("lead_id"),
    buyerId: text("buyer_id"),
    sellerId: text("seller_id"),
    campaignId: text("campaign_id"),
    showingId: text("showing_id"),
    openHouseId: text("open_house_id"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => [index("real_estate_communications_tenant_idx").on(t.tenantId), index("real_estate_communications_status_idx").on(t.tenantId, t.status), index("real_estate_communications_provider_message_idx").on(t.provider, t.providerMessageId), unique("real_estate_communications_tenant_idempotency_unique").on(t.tenantId, t.idempotencyKey)]
);

export const realEstateCampaigns = pgTable(
  "real_estate_campaigns",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    propertyId: text("property_id").references(() => realEstateProperties.id),
    name: text("name").notNull(),
    campaignType: text("campaign_type").notNull(),
    status: text("status").notNull().default("draft"),
    channels: jsonb("channels").$type<string[]>().notNull().default([]),
    content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
    audienceType: text("audience_type").notNull().default("leads"),
    audienceFilters: jsonb("audience_filters").$type<Record<string, unknown>>().notNull().default({}),
    templateId: text("template_id"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: "string" }),
    launchedAt: timestamp("launched_at", { withTimezone: true, mode: "string" }),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "string" }),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "string" }),
    createdByMembershipId: text("created_by_membership_id").references(() => realEstateMemberships.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [index("real_estate_campaigns_tenant_idx").on(t.tenantId), index("real_estate_campaigns_property_idx").on(t.propertyId)]
);

export const realEstateAnalyticsEvents = pgTable(
  "real_estate_analytics_events",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    eventName: text("event_name").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    anonymousId: text("anonymous_id"),
    source: text("source").notNull().default("app"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => [index("real_estate_analytics_tenant_event_idx").on(t.tenantId, t.eventName), index("real_estate_analytics_entity_idx").on(t.entityType, t.entityId)]
);

export const realEstateCommunicationTemplates = pgTable(
  "real_estate_communication_templates",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    name: text("name").notNull(),
    templateType: text("template_type").notNull(),
    language: text("language").notNull().default("en"),
    channel: text("channel").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdByMembershipId: text("created_by_membership_id").references(() => realEstateMemberships.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [index("real_estate_templates_tenant_idx").on(t.tenantId), unique("real_estate_templates_tenant_name_language_unique").on(t.tenantId, t.name, t.language)]
);

export const realEstateCommunicationPreferences = pgTable(
  "real_estate_communication_preferences",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    contactType: text("contact_type").notNull(),
    contactId: text("contact_id"),
    email: text("email"),
    phone: text("phone"),
    emailOptIn: boolean("email_opt_in").notNull().default(false),
    smsOptIn: boolean("sms_opt_in").notNull().default(false),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    transactionalConsent: boolean("transactional_consent").notNull().default(true),
    language: text("language").notNull().default("en"),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true, mode: "string" }),
    smsStoppedAt: timestamp("sms_stopped_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => [index("real_estate_preferences_tenant_idx").on(t.tenantId), uniqueIndex("real_estate_preferences_tenant_email_idx").on(t.tenantId, t.email), uniqueIndex("real_estate_preferences_tenant_phone_idx").on(t.tenantId, t.phone)]
);

export const realEstateAutomationWorkflows = pgTable(
  "real_estate_automation_workflows",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    name: text("name").notNull(),
    trigger: text("trigger").notNull(),
    status: text("status").notNull().default("active"),
    steps: jsonb("steps").$type<Array<Record<string, unknown>>>().notNull().default([]),
    createdByMembershipId: text("created_by_membership_id").references(() => realEstateMemberships.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [index("real_estate_workflows_tenant_idx").on(t.tenantId)]
);

export const realEstateAutomationRuns = pgTable(
  "real_estate_automation_runs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    workflowId: text("workflow_id").notNull().references(() => realEstateAutomationWorkflows.id),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    status: text("status").notNull().default("queued"),
    currentStep: integer("current_step").notNull().default(0),
    nextRunAt: timestamp("next_run_at", { withTimezone: true, mode: "string" }),
    history: jsonb("history").$type<Array<Record<string, unknown>>>().notNull().default([]),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => [index("real_estate_runs_tenant_status_idx").on(t.tenantId, t.status), unique("real_estate_runs_dedupe_unique").on(t.workflowId, t.entityType, t.entityId)]
);

export const realEstateNurtureEnrollments = pgTable(
  "real_estate_nurture_enrollments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    leadId: text("lead_id").notNull().references(() => realEstateLeads.id),
    assignedAgentId: text("assigned_agent_id").references(() => realEstateAgents.id),
    sequenceType: text("sequence_type").notNull(),
    status: text("status").notNull().default("active"),
    currentStep: integer("current_step").notNull().default(0),
    nextActionAt: timestamp("next_action_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [index("real_estate_nurture_tenant_idx").on(t.tenantId), unique("real_estate_nurture_active_unique").on(t.tenantId, t.leadId, t.sequenceType)]
);

export const realEstateAppointments = pgTable(
  "real_estate_appointments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    assignedAgentId: text("assigned_agent_id").references(() => realEstateAgents.id),
    leadId: text("lead_id").references(() => realEstateLeads.id),
    appointmentType: text("appointment_type").notNull(),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "string" }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "string" }),
    status: text("status").notNull().default("scheduled"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [index("real_estate_appointments_tenant_date_idx").on(t.tenantId, t.startsAt), index("real_estate_appointments_agent_idx").on(t.assignedAgentId)]
);

export const realEstateNotifications = pgTable(
  "real_estate_notifications",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    membershipId: text("membership_id").references(() => realEstateMemberships.id),
    type: text("type").notNull(),
    priority: text("priority").notNull().default("normal"),
    title: text("title").notNull(),
    message: text("message").notNull(),
    href: text("href"),
    readAt: timestamp("read_at", { withTimezone: true, mode: "string" }),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => [index("real_estate_notifications_tenant_idx").on(t.tenantId), index("real_estate_notifications_member_idx").on(t.membershipId)]
);

export const realEstateQrLinks = pgTable(
  "real_estate_qr_links",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    destinationType: text("destination_type").notNull(),
    destinationId: text("destination_id").notNull(),
    destinationUrl: text("destination_url").notNull(),
    campaignId: text("campaign_id").references(() => realEstateCampaigns.id),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [index("real_estate_qr_tenant_idx").on(t.tenantId), unique("real_estate_qr_destination_unique").on(t.tenantId, t.destinationType, t.destinationId, t.campaignId)]
);

export const realEstateQrScans = pgTable(
  "real_estate_qr_scans",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    qrLinkId: text("qr_link_id").notNull().references(() => realEstateQrLinks.id),
    campaignId: text("campaign_id").references(() => realEstateCampaigns.id),
    anonymousSessionId: text("anonymous_session_id"),
    device: text("device"),
    referrer: text("referrer"),
    scannedAt: timestamp("scanned_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => [index("real_estate_qr_scans_tenant_idx").on(t.tenantId), index("real_estate_qr_scans_link_idx").on(t.qrLinkId)]
);

export const realEstateJobs = pgTable(
  "real_estate_jobs",
  {
    id: text("id").primaryKey(), tenantId: text("tenant_id").notNull(), organizationId: text("organization_id").notNull(),
    jobType: text("job_type").notNull(), status: text("status").notNull().default("pending"), priority: integer("priority").notNull().default(100),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}), payloadVersion: integer("payload_version").notNull().default(1),
    idempotencyKey: text("idempotency_key").notNull(), scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: "string" }),
    availableAt: timestamp("available_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(), lockedAt: timestamp("locked_at", { withTimezone: true, mode: "string" }),
    lockExpiresAt: timestamp("lock_expires_at", { withTimezone: true, mode: "string" }), lockedBy: text("locked_by"),
    attemptCount: integer("attempt_count").notNull().default(0), maxAttempts: integer("max_attempts").notNull().default(5),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }), completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
    failedAt: timestamp("failed_at", { withTimezone: true, mode: "string" }), cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: "string" }),
    lastErrorCode: text("last_error_code"), lastErrorMessage: text("last_error_message"),
    createdByMembershipId: text("created_by_membership_id").references(() => realEstateMemberships.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [unique("real_estate_jobs_tenant_idempotency_unique").on(t.tenantId, t.idempotencyKey), index("real_estate_jobs_claim_idx").on(t.status, t.availableAt, t.priority), index("real_estate_jobs_tenant_status_idx").on(t.tenantId, t.status)]
);
export const realEstateJobAttempts = pgTable("real_estate_job_attempts", {
  id: text("id").primaryKey(), tenantId: text("tenant_id").notNull(), jobId: text("job_id").notNull().references(() => realEstateJobs.id, { onDelete: "cascade" }),
  attemptNumber: integer("attempt_number").notNull(), workerId: text("worker_id").notNull(), status: text("status").notNull(),
  safeErrorCode: text("safe_error_code"), safeErrorMessage: text("safe_error_message"), startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
}, (t) => [index("real_estate_job_attempts_job_idx").on(t.jobId), index("real_estate_job_attempts_tenant_idx").on(t.tenantId)]);
export const realEstateJobLocks = pgTable("real_estate_job_locks", {
  id: text("id").primaryKey(), jobId: text("job_id").notNull().references(() => realEstateJobs.id, { onDelete: "cascade" }), workerId: text("worker_id").notNull(),
  acquiredAt: timestamp("acquired_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(), expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
}, (t) => [unique("real_estate_job_locks_job_unique").on(t.jobId), index("real_estate_job_locks_expiry_idx").on(t.expiresAt)]);
export const realEstateDeadLetters = pgTable("real_estate_dead_letters", {
  id: text("id").primaryKey(), tenantId: text("tenant_id").notNull(), jobId: text("job_id").notNull().references(() => realEstateJobs.id),
  jobType: text("job_type").notNull(), safeErrorCode: text("safe_error_code"), safeErrorMessage: text("safe_error_message"),
  attemptCount: integer("attempt_count").notNull(), requeuedAt: timestamp("requeued_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (t) => [unique("real_estate_dead_letters_job_unique").on(t.jobId), index("real_estate_dead_letters_tenant_idx").on(t.tenantId)]);

export const realEstateOauthStates = pgTable("real_estate_oauth_states", {
  id: text("id").primaryKey(), tenantId: text("tenant_id").notNull(), membershipId: text("membership_id").notNull().references(() => realEstateMemberships.id),
  provider: text("provider").notNull(), stateHash: text("state_hash").notNull(), expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true, mode: "string" }), createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (t) => [unique("real_estate_oauth_state_hash_unique").on(t.stateHash), index("real_estate_oauth_state_expiry_idx").on(t.expiresAt)]);
export const realEstateCalendarEventLinks = pgTable("real_estate_calendar_event_links", {
  id: text("id").primaryKey(), tenantId: text("tenant_id").notNull(), connectionId: text("connection_id").notNull().references(() => realEstateCalendarConnections.id, { onDelete: "cascade" }),
  internalEventType: text("internal_event_type").notNull(), internalEventId: text("internal_event_id").notNull(), externalCalendarId: text("external_calendar_id").notNull(),
  externalEventId: text("external_event_id"), providerEtag: text("provider_etag"), synchronizedHash: text("synchronized_hash"), status: text("status").notNull().default("pending"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true, mode: "string" }), lastErrorCode: text("last_error_code"), lastErrorMessage: text("last_error_message"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (t) => [unique("real_estate_calendar_link_unique").on(t.connectionId, t.internalEventType, t.internalEventId, t.externalCalendarId), index("real_estate_calendar_external_idx").on(t.connectionId, t.externalEventId), index("real_estate_calendar_link_tenant_idx").on(t.tenantId)]);

export const realEstateWebhookEvents = pgTable("real_estate_webhook_events", {
  id: text("id").primaryKey(), provider: text("provider").notNull(), providerEventId: text("provider_event_id"), eventType: text("event_type").notNull(),
  signatureVerified: boolean("signature_verified").notNull(), receivedAt: timestamp("received_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true, mode: "string" }), status: text("status").notNull().default("received"), attemptCount: integer("attempt_count").notNull().default(0),
  payloadHash: text("payload_hash").notNull(), safeMetadata: jsonb("safe_metadata").$type<Record<string, unknown>>().notNull().default({}),
  lastErrorCode: text("last_error_code"), lastErrorMessage: text("last_error_message"), createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (t) => [unique("real_estate_webhook_provider_event_unique").on(t.provider, t.providerEventId), unique("real_estate_webhook_provider_hash_unique").on(t.provider, t.payloadHash), index("real_estate_webhook_status_idx").on(t.status, t.receivedAt)]);
export const realEstateCommunicationEvents = pgTable("real_estate_communication_events", {
  id: text("id").primaryKey(), tenantId: text("tenant_id").notNull(), communicationId: text("communication_id").notNull().references(() => realEstateCommunications.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), eventType: text("event_type").notNull(), providerEventId: text("provider_event_id"), occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "string" }).notNull(),
  safeMetadata: jsonb("safe_metadata").$type<Record<string, unknown>>().notNull().default({}), createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (t) => [unique("real_estate_communication_event_unique").on(t.provider, t.providerEventId), index("real_estate_communication_events_tenant_idx").on(t.tenantId), index("real_estate_communication_events_message_idx").on(t.communicationId)]);
export const realEstateContactSuppressions = pgTable("real_estate_contact_suppressions", {
  id: text("id").primaryKey(), tenantId: text("tenant_id").notNull(), channel: text("channel").notNull(), recipientHash: text("recipient_hash").notNull(), suppressionType: text("suppression_type").notNull(),
  source: text("source").notNull(), reason: text("reason"), createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(), removedAt: timestamp("removed_at", { withTimezone: true, mode: "string" }),
}, (t) => [unique("real_estate_suppression_active_unique").on(t.tenantId, t.channel, t.recipientHash, t.suppressionType), index("real_estate_suppressions_tenant_idx").on(t.tenantId)]);
export const realEstateDeliverabilityDaily = pgTable("real_estate_deliverability_daily", {
  id: text("id").primaryKey(), tenantId: text("tenant_id").notNull(), day: text("day").notNull(), provider: text("provider").notNull(), campaignId: text("campaign_id"),
  metrics: jsonb("metrics").$type<Record<string, number>>().notNull().default({}), createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (t) => [unique("real_estate_deliverability_daily_unique").on(t.tenantId, t.day, t.provider, t.campaignId), index("real_estate_deliverability_tenant_idx").on(t.tenantId, t.day)]);
export const realEstateProviderHealthChecks = pgTable("real_estate_provider_health_checks", {
  id: text("id").primaryKey(), tenantId: text("tenant_id"), provider: text("provider").notNull(), status: text("status").notNull(), checkedAt: timestamp("checked_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true, mode: "string" }), lastFailureAt: timestamp("last_failure_at", { withTimezone: true, mode: "string" }),
  safeFailureCode: text("safe_failure_code"), safeFailureMessage: text("safe_failure_message"), latencyMs: integer("latency_ms"),
}, (t) => [index("real_estate_health_provider_idx").on(t.provider, t.checkedAt), index("real_estate_health_tenant_idx").on(t.tenantId, t.checkedAt)]);
export const realEstateOperationalIncidents = pgTable("real_estate_operational_incidents", {
  id: text("id").primaryKey(), tenantId: text("tenant_id"), incidentKey: text("incident_key").notNull(), type: text("type").notNull(), status: text("status").notNull().default("open"),
  severity: text("severity").notNull().default("warning"), safeMessage: text("safe_message").notNull(), openedAt: timestamp("opened_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "string" }), lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true, mode: "string" }),
}, (t) => [unique("real_estate_incident_key_unique").on(t.incidentKey), index("real_estate_incident_tenant_idx").on(t.tenantId, t.status)]);

// ---------------------------------------------------------------------------
// Real Estate transactions and private client collaboration (Phase 7)
// ---------------------------------------------------------------------------
export const realEstateTransactions = pgTable("real_estate_transactions", {
  id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),brokerageId:text("brokerage_id").notNull().references(()=>realEstateBrokerages.id),
  transactionNumber:text("transaction_number").notNull(),transactionType:text("transaction_type").notNull(),status:text("status").notNull().default("draft"),priority:text("priority").notNull().default("normal"),
  propertyId:text("property_id").references(()=>realEstateProperties.id),leadId:text("lead_id").references(()=>realEstateLeads.id),buyerId:text("buyer_id").references(()=>realEstateBuyers.id),sellerId:text("seller_id").references(()=>realEstateSellers.id),
  listingAgentMembershipId:text("listing_agent_membership_id").references(()=>realEstateMemberships.id),buyerAgentMembershipId:text("buyer_agent_membership_id").references(()=>realEstateMemberships.id),transactionCoordinatorMembershipId:text("transaction_coordinator_membership_id").references(()=>realEstateMemberships.id),
  purchasePriceCents:integer("purchase_price_cents"),listPriceCents:integer("list_price_cents"),earnestMoneyAmountCents:integer("earnest_money_amount_cents"),dueDiligenceAmountCents:integer("due_diligence_amount_cents"),financingAmountCents:integer("financing_amount_cents"),downPaymentAmountCents:integer("down_payment_amount_cents"),
  contractDate:timestamp("contract_date",{withTimezone:true,mode:"string"}),bindingAgreementDate:timestamp("binding_agreement_date",{withTimezone:true,mode:"string"}),dueDiligenceDeadline:timestamp("due_diligence_deadline",{withTimezone:true,mode:"string"}),inspectionDeadline:timestamp("inspection_deadline",{withTimezone:true,mode:"string"}),financingDeadline:timestamp("financing_deadline",{withTimezone:true,mode:"string"}),appraisalDeadline:timestamp("appraisal_deadline",{withTimezone:true,mode:"string"}),closingDate:timestamp("closing_date",{withTimezone:true,mode:"string"}),possessionDate:timestamp("possession_date",{withTimezone:true,mode:"string"}),
  closingAttorneyName:text("closing_attorney_name"),closingAttorneyEmail:text("closing_attorney_email"),closingAttorneyPhone:text("closing_attorney_phone"),lenderName:text("lender_name"),lenderContactName:text("lender_contact_name"),lenderEmail:text("lender_email"),lenderPhone:text("lender_phone"),titleCompanyName:text("title_company_name"),titleContactName:text("title_contact_name"),titleEmail:text("title_email"),titlePhone:text("title_phone"),escrowCompanyName:text("escrow_company_name"),escrowContactName:text("escrow_contact_name"),escrowEmail:text("escrow_email"),escrowPhone:text("escrow_phone"),
  notes:text("notes").notNull().default(""),internalNotes:text("internal_notes").notNull().default(""),createdByMembershipId:text("created_by_membership_id").notNull().references(()=>realEstateMemberships.id),updatedByMembershipId:text("updated_by_membership_id").references(()=>realEstateMemberships.id),closedByMembershipId:text("closed_by_membership_id").references(()=>realEstateMemberships.id),cancelledByMembershipId:text("cancelled_by_membership_id").references(()=>realEstateMemberships.id),
  createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),closedAt:timestamp("closed_at",{withTimezone:true,mode:"string"}),cancelledAt:timestamp("cancelled_at",{withTimezone:true,mode:"string"}),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"}),
},t=>[unique("re_transactions_tenant_number_unique").on(t.tenantId,t.transactionNumber),index("re_transactions_tenant_org_idx").on(t.tenantId,t.organizationId),index("re_transactions_status_idx").on(t.tenantId,t.status),index("re_transactions_property_idx").on(t.propertyId),index("re_transactions_closing_idx").on(t.tenantId,t.closingDate),index("re_transactions_agents_idx").on(t.listingAgentMembershipId,t.buyerAgentMembershipId)]);
export const realEstateTransactionParticipants=pgTable("real_estate_transaction_participants",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),transactionId:text("transaction_id").notNull().references(()=>realEstateTransactions.id,{onDelete:"cascade"}),role:text("role").notNull(),membershipId:text("membership_id").references(()=>realEstateMemberships.id),portalUserId:text("portal_user_id"),name:text("name").notNull(),email:text("email"),phone:text("phone"),clientVisible:boolean("client_visible").notNull().default(false),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[index("re_tx_participants_scope_idx").on(t.tenantId,t.organizationId,t.transactionId)]);
export const realEstateTransactionStatusHistory=pgTable("real_estate_transaction_status_history",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),transactionId:text("transaction_id").notNull().references(()=>realEstateTransactions.id,{onDelete:"cascade"}),fromStatus:text("from_status"),toStatus:text("to_status").notNull(),actorMembershipId:text("actor_membership_id").notNull().references(()=>realEstateMemberships.id),idempotencyKey:text("idempotency_key").notNull(),reason:text("reason"),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_tx_status_idempotency_unique").on(t.transactionId,t.idempotencyKey),index("re_tx_status_scope_idx").on(t.tenantId,t.transactionId)]);
export const realEstateTransactionMilestones=pgTable("real_estate_transaction_milestones",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),transactionId:text("transaction_id").notNull().references(()=>realEstateTransactions.id,{onDelete:"cascade"}),milestoneType:text("milestone_type").notNull(),title:text("title").notNull(),dueAt:timestamp("due_at",{withTimezone:true,mode:"string"}),status:text("status").notNull().default("pending"),clientVisible:boolean("client_visible").notNull().default(true),manuallyAdjusted:boolean("manually_adjusted").notNull().default(false),completedAt:timestamp("completed_at",{withTimezone:true,mode:"string"}),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[index("re_milestones_due_idx").on(t.tenantId,t.status,t.dueAt),index("re_milestones_tx_idx").on(t.transactionId)]);
export const realEstateTransactionNotes=pgTable("real_estate_transaction_notes",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),transactionId:text("transaction_id").notNull().references(()=>realEstateTransactions.id,{onDelete:"cascade"}),authorMembershipId:text("author_membership_id").references(()=>realEstateMemberships.id),authorPortalUserId:text("author_portal_user_id"),body:text("body").notNull(),clientVisible:boolean("client_visible").notNull().default(false),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[index("re_tx_notes_idx").on(t.tenantId,t.transactionId,t.createdAt)]);

export const realEstateOffers=pgTable("real_estate_offers",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),transactionId:text("transaction_id").notNull().references(()=>realEstateTransactions.id,{onDelete:"cascade"}),propertyId:text("property_id").references(()=>realEstateProperties.id),offerNumber:text("offer_number").notNull(),currentRevisionNumber:integer("current_revision_number").notNull().default(1),status:text("status").notNull().default("draft"),buyerId:text("buyer_id").references(()=>realEstateBuyers.id),sellerId:text("seller_id").references(()=>realEstateSellers.id),submittedByMembershipId:text("submitted_by_membership_id").references(()=>realEstateMemberships.id),receivedByMembershipId:text("received_by_membership_id").references(()=>realEstateMemberships.id),submittedAt:timestamp("submitted_at",{withTimezone:true,mode:"string"}),acceptedAt:timestamp("accepted_at",{withTimezone:true,mode:"string"}),rejectedAt:timestamp("rejected_at",{withTimezone:true,mode:"string"}),withdrawnAt:timestamp("withdrawn_at",{withTimezone:true,mode:"string"}),expiredAt:timestamp("expired_at",{withTimezone:true,mode:"string"}),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[unique("re_offers_tx_number_unique").on(t.transactionId,t.offerNumber),index("re_offers_scope_idx").on(t.tenantId,t.organizationId,t.transactionId),index("re_offers_status_idx").on(t.tenantId,t.status)]);
export const realEstateOfferRevisions=pgTable("real_estate_offer_revisions",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),offerId:text("offer_id").notNull().references(()=>realEstateOffers.id,{onDelete:"cascade"}),revisionNumber:integer("revision_number").notNull(),status:text("status").notNull().default("draft"),offerPriceCents:integer("offer_price_cents").notNull(),earnestMoneyAmountCents:integer("earnest_money_amount_cents"),dueDiligenceAmountCents:integer("due_diligence_amount_cents"),financingType:text("financing_type"),financingAmountCents:integer("financing_amount_cents"),downPaymentAmountCents:integer("down_payment_amount_cents"),closingDate:timestamp("closing_date",{withTimezone:true,mode:"string"}),expirationAt:timestamp("expiration_at",{withTimezone:true,mode:"string"}),possessionDate:timestamp("possession_date",{withTimezone:true,mode:"string"}),contingencies:jsonb("contingencies").$type<string[]>().notNull().default([]),terms:text("terms").notNull().default(""),notes:text("notes").notNull().default(""),offerDocumentId:text("offer_document_id"),createdByMembershipId:text("created_by_membership_id").notNull().references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_offer_revision_unique").on(t.offerId,t.revisionNumber),index("re_offer_revision_scope_idx").on(t.tenantId,t.offerId)]);
export const realEstateOfferStatusHistory=pgTable("real_estate_offer_status_history",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),offerId:text("offer_id").notNull().references(()=>realEstateOffers.id,{onDelete:"cascade"}),revisionId:text("revision_id").references(()=>realEstateOfferRevisions.id),fromStatus:text("from_status"),toStatus:text("to_status").notNull(),actorMembershipId:text("actor_membership_id").notNull().references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_offer_status_idx").on(t.tenantId,t.offerId,t.createdAt)]);

export const realEstateInspections=pgTable("real_estate_inspections",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),transactionId:text("transaction_id").notNull().references(()=>realEstateTransactions.id,{onDelete:"cascade"}),inspectorName:text("inspector_name"),inspectorCompany:text("inspector_company"),inspectorEmail:text("inspector_email"),inspectorPhone:text("inspector_phone"),scheduledAt:timestamp("scheduled_at",{withTimezone:true,mode:"string"}),completedAt:timestamp("completed_at",{withTimezone:true,mode:"string"}),reportDocumentId:text("report_document_id"),status:text("status").notNull().default("not_scheduled"),summary:text("summary").notNull().default(""),notes:text("notes").notNull().default(""),clientVisible:boolean("client_visible").notNull().default(true),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[index("re_inspections_scope_idx").on(t.tenantId,t.organizationId,t.transactionId),index("re_inspections_date_idx").on(t.tenantId,t.scheduledAt)]);
export const realEstateInspectionItems=pgTable("real_estate_inspection_items",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),inspectionId:text("inspection_id").notNull().references(()=>realEstateInspections.id,{onDelete:"cascade"}),title:text("title").notNull(),category:text("category"),severity:text("severity").notNull().default("normal"),description:text("description").notNull().default(""),clientVisible:boolean("client_visible").notNull().default(true),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_inspection_items_idx").on(t.tenantId,t.inspectionId)]);
export const realEstateRepairRequests=pgTable("real_estate_repair_requests",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),inspectionId:text("inspection_id").notNull().references(()=>realEstateInspections.id,{onDelete:"cascade"}),title:text("title").notNull(),description:text("description").notNull().default(""),category:text("category"),priority:text("priority").notNull().default("normal"),estimatedCostCents:integer("estimated_cost_cents"),requestedResolution:text("requested_resolution"),status:text("status").notNull().default("requested"),assignedTo:text("assigned_to"),dueDate:timestamp("due_date",{withTimezone:true,mode:"string"}),completedAt:timestamp("completed_at",{withTimezone:true,mode:"string"}),completionDocumentId:text("completion_document_id"),clientVisible:boolean("client_visible").notNull().default(true),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[index("re_repairs_due_idx").on(t.tenantId,t.status,t.dueDate),index("re_repairs_inspection_idx").on(t.inspectionId)]);
export const realEstateRepairUpdates=pgTable("real_estate_repair_updates",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),repairRequestId:text("repair_request_id").notNull().references(()=>realEstateRepairRequests.id,{onDelete:"cascade"}),actorMembershipId:text("actor_membership_id").references(()=>realEstateMemberships.id),actorPortalUserId:text("actor_portal_user_id"),status:text("status").notNull(),message:text("message").notNull().default(""),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_repair_updates_idx").on(t.tenantId,t.repairRequestId,t.createdAt)]);
export const realEstateEscrowRecords=pgTable("real_estate_escrow_records",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),transactionId:text("transaction_id").notNull().references(()=>realEstateTransactions.id,{onDelete:"cascade"}),escrowCompanyName:text("escrow_company_name"),escrowContactName:text("escrow_contact_name"),escrowContactEmail:text("escrow_contact_email"),escrowContactPhone:text("escrow_contact_phone"),amountCents:integer("amount_cents"),dueDate:timestamp("due_date",{withTimezone:true,mode:"string"}),depositDate:timestamp("deposit_date",{withTimezone:true,mode:"string"}),verifiedAt:timestamp("verified_at",{withTimezone:true,mode:"string"}),releaseDate:timestamp("release_date",{withTimezone:true,mode:"string"}),status:text("status").notNull().default("pending"),referenceNumber:text("reference_number"),receiptDocumentId:text("receipt_document_id"),notes:text("notes").notNull().default(""),clientVisible:boolean("client_visible").notNull().default(true),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[index("re_escrow_scope_idx").on(t.tenantId,t.organizationId,t.transactionId),index("re_escrow_due_idx").on(t.tenantId,t.status,t.dueDate)]);
export const realEstateEscrowEvents=pgTable("real_estate_escrow_events",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),escrowRecordId:text("escrow_record_id").notNull().references(()=>realEstateEscrowRecords.id,{onDelete:"cascade"}),fromStatus:text("from_status"),toStatus:text("to_status").notNull(),actorMembershipId:text("actor_membership_id").notNull().references(()=>realEstateMemberships.id),safeMetadata:jsonb("safe_metadata").$type<Record<string,unknown>>().notNull().default({}),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_escrow_events_idx").on(t.tenantId,t.escrowRecordId,t.createdAt)]);

export const realEstatePortalUsers=pgTable("real_estate_portal_users",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),email:text("email").notNull(),firstName:text("first_name").notNull(),lastName:text("last_name").notNull(),role:text("role").notNull(),emailVerifiedAt:timestamp("email_verified_at",{withTimezone:true,mode:"string"}),isActive:boolean("is_active").notNull().default(true),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[unique("re_portal_user_tenant_email_unique").on(t.tenantId,t.email),index("re_portal_users_tenant_idx").on(t.tenantId)]);
export const realEstatePortalInvitations=pgTable("real_estate_portal_invitations",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),transactionId:text("transaction_id").notNull().references(()=>realEstateTransactions.id,{onDelete:"cascade"}),email:text("email").notNull(),role:text("role").notNull(),tokenHash:text("token_hash").notNull(),invitedByMembershipId:text("invited_by_membership_id").notNull().references(()=>realEstateMemberships.id),expiresAt:timestamp("expires_at",{withTimezone:true,mode:"string"}).notNull(),acceptedAt:timestamp("accepted_at",{withTimezone:true,mode:"string"}),revokedAt:timestamp("revoked_at",{withTimezone:true,mode:"string"}),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_portal_invite_token_unique").on(t.tokenHash),index("re_portal_invite_scope_idx").on(t.tenantId,t.email,t.expiresAt),index("re_portal_invite_tx_idx").on(t.tenantId,t.transactionId)]);
export const realEstatePortalSessions=pgTable("real_estate_portal_sessions",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),portalUserId:text("portal_user_id").notNull().references(()=>realEstatePortalUsers.id,{onDelete:"cascade"}),tokenHash:text("token_hash").notNull(),expiresAt:timestamp("expires_at",{withTimezone:true,mode:"string"}).notNull(),revokedAt:timestamp("revoked_at",{withTimezone:true,mode:"string"}),lastSeenAt:timestamp("last_seen_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_portal_session_token_unique").on(t.tokenHash),index("re_portal_session_expiry_idx").on(t.portalUserId,t.expiresAt)]);
export const realEstatePortalAccessGrants=pgTable("real_estate_portal_access_grants",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),portalUserId:text("portal_user_id").notNull().references(()=>realEstatePortalUsers.id,{onDelete:"cascade"}),transactionId:text("transaction_id").notNull().references(()=>realEstateTransactions.id,{onDelete:"cascade"}),permissions:jsonb("permissions").$type<string[]>().notNull().default([]),expiresAt:timestamp("expires_at",{withTimezone:true,mode:"string"}),revokedAt:timestamp("revoked_at",{withTimezone:true,mode:"string"}),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_portal_grant_unique").on(t.portalUserId,t.transactionId),index("re_portal_grant_scope_idx").on(t.tenantId,t.organizationId,t.transactionId)]);

export const realEstateDocumentFolders=pgTable("real_estate_document_folders",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),transactionId:text("transaction_id").references(()=>realEstateTransactions.id,{onDelete:"cascade"}),name:text("name").notNull(),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[index("re_doc_folders_scope_idx").on(t.tenantId,t.organizationId,t.transactionId)]);
export const realEstateDocuments=pgTable("real_estate_documents",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),transactionId:text("transaction_id").references(()=>realEstateTransactions.id,{onDelete:"cascade"}),propertyId:text("property_id").references(()=>realEstateProperties.id),folderId:text("folder_id").references(()=>realEstateDocumentFolders.id),category:text("category").notNull(),title:text("title").notNull(),description:text("description").notNull().default(""),status:text("status").notNull().default("pending_scan"),visibility:text("visibility").notNull().default("internal"),currentVersionId:text("current_version_id"),uploadedByMembershipId:text("uploaded_by_membership_id").references(()=>realEstateMemberships.id),uploadedByPortalUserId:text("uploaded_by_portal_user_id").references(()=>realEstatePortalUsers.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[index("re_documents_scope_idx").on(t.tenantId,t.organizationId,t.transactionId),index("re_documents_visibility_idx").on(t.transactionId,t.visibility,t.status)]);
export const realEstateDocumentVersions=pgTable("real_estate_document_versions",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),documentId:text("document_id").notNull().references(()=>realEstateDocuments.id,{onDelete:"cascade"}),versionNumber:integer("version_number").notNull(),blobKey:text("blob_key").notNull(),originalFilename:text("original_filename").notNull(),safeFilename:text("safe_filename").notNull(),mimeType:text("mime_type").notNull(),byteSize:integer("byte_size").notNull(),checksum:text("checksum").notNull(),scanStatus:text("scan_status").notNull().default("pending"),uploadedByMembershipId:text("uploaded_by_membership_id").references(()=>realEstateMemberships.id),uploadedByPortalUserId:text("uploaded_by_portal_user_id").references(()=>realEstatePortalUsers.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[unique("re_document_version_unique").on(t.documentId,t.versionNumber),unique("re_document_blob_key_unique").on(t.blobKey),index("re_document_versions_tenant_idx").on(t.tenantId,t.documentId)]);
export const realEstateDocumentAccessGrants=pgTable("real_estate_document_access_grants",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),documentId:text("document_id").notNull().references(()=>realEstateDocuments.id,{onDelete:"cascade"}),membershipId:text("membership_id").references(()=>realEstateMemberships.id),portalUserId:text("portal_user_id").references(()=>realEstatePortalUsers.id),canDownload:boolean("can_download").notNull().default(true),expiresAt:timestamp("expires_at",{withTimezone:true,mode:"string"}),revokedAt:timestamp("revoked_at",{withTimezone:true,mode:"string"}),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_document_grants_idx").on(t.tenantId,t.documentId,t.portalUserId)]);
export const realEstateDocumentAccessEvents=pgTable("real_estate_document_access_events",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),documentId:text("document_id").notNull().references(()=>realEstateDocuments.id),versionId:text("version_id").references(()=>realEstateDocumentVersions.id),actorMembershipId:text("actor_membership_id"),actorPortalUserId:text("actor_portal_user_id"),action:text("action").notNull(),ipHash:text("ip_hash"),occurredAt:timestamp("occurred_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_document_access_idx").on(t.tenantId,t.documentId,t.occurredAt)]);
export const realEstateDocumentRequests=pgTable("real_estate_document_requests",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),transactionId:text("transaction_id").notNull().references(()=>realEstateTransactions.id,{onDelete:"cascade"}),requestedFromPortalUserId:text("requested_from_portal_user_id").notNull().references(()=>realEstatePortalUsers.id),requestedByMembershipId:text("requested_by_membership_id").notNull().references(()=>realEstateMemberships.id),title:text("title").notNull(),description:text("description").notNull().default(""),category:text("category").notNull(),dueAt:timestamp("due_at",{withTimezone:true,mode:"string"}),status:text("status").notNull().default("pending"),fulfilledDocumentId:text("fulfilled_document_id").references(()=>realEstateDocuments.id),clientExplanation:text("client_explanation"),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),completedAt:timestamp("completed_at",{withTimezone:true,mode:"string"}),cancelledAt:timestamp("cancelled_at",{withTimezone:true,mode:"string"})},t=>[index("re_document_requests_due_idx").on(t.tenantId,t.status,t.dueAt),index("re_document_requests_tx_idx").on(t.transactionId)]);
export const realEstateDocumentShareLinks=pgTable("real_estate_document_share_links",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),documentId:text("document_id").notNull().references(()=>realEstateDocuments.id,{onDelete:"cascade"}),tokenHash:text("token_hash").notNull(),passwordHash:text("password_hash"),recipientEmailHash:text("recipient_email_hash"),expiresAt:timestamp("expires_at",{withTimezone:true,mode:"string"}).notNull(),maxDownloads:integer("max_downloads"),downloadCount:integer("download_count").notNull().default(0),oneTime:boolean("one_time").notNull().default(false),downloadAllowed:boolean("download_allowed").notNull().default(true),watermark:boolean("watermark").notNull().default(false),revokedAt:timestamp("revoked_at",{withTimezone:true,mode:"string"}),createdByMembershipId:text("created_by_membership_id").notNull().references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_document_share_token_unique").on(t.tokenHash),index("re_document_share_expiry_idx").on(t.expiresAt,t.revokedAt)]);
export const realEstateDocumentShareEvents=pgTable("real_estate_document_share_events",{id:text("id").primaryKey(),shareLinkId:text("share_link_id").notNull().references(()=>realEstateDocumentShareLinks.id,{onDelete:"cascade"}),action:text("action").notNull(),ipHash:text("ip_hash"),safeMetadata:jsonb("safe_metadata").$type<Record<string,unknown>>().notNull().default({}),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_document_share_events_idx").on(t.shareLinkId,t.createdAt)]);

export const realEstateMessageThreads=pgTable("real_estate_message_threads",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),transactionId:text("transaction_id").references(()=>realEstateTransactions.id,{onDelete:"cascade"}),threadType:text("thread_type").notNull(),title:text("title").notNull(),clientVisible:boolean("client_visible").notNull().default(false),createdByMembershipId:text("created_by_membership_id").references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[index("re_message_threads_scope_idx").on(t.tenantId,t.organizationId,t.transactionId,t.updatedAt)]);
export const realEstateMessages=pgTable("real_estate_messages",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),threadId:text("thread_id").notNull().references(()=>realEstateMessageThreads.id,{onDelete:"cascade"}),senderMembershipId:text("sender_membership_id").references(()=>realEstateMemberships.id),senderPortalUserId:text("sender_portal_user_id").references(()=>realEstatePortalUsers.id),body:text("body").notNull(),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[index("re_messages_page_idx").on(t.tenantId,t.threadId,t.createdAt)]);
export const realEstateMessageParticipants=pgTable("real_estate_message_participants",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),threadId:text("thread_id").notNull().references(()=>realEstateMessageThreads.id,{onDelete:"cascade"}),membershipId:text("membership_id").references(()=>realEstateMemberships.id),portalUserId:text("portal_user_id").references(()=>realEstatePortalUsers.id),joinedAt:timestamp("joined_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),removedAt:timestamp("removed_at",{withTimezone:true,mode:"string"})},t=>[index("re_message_participant_thread_idx").on(t.tenantId,t.threadId),index("re_message_participant_portal_idx").on(t.portalUserId)]);
export const realEstateMessageReadReceipts=pgTable("real_estate_message_read_receipts",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),messageId:text("message_id").notNull().references(()=>realEstateMessages.id,{onDelete:"cascade"}),membershipId:text("membership_id").references(()=>realEstateMemberships.id),portalUserId:text("portal_user_id").references(()=>realEstatePortalUsers.id),readAt:timestamp("read_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_message_receipts_idx").on(t.tenantId,t.messageId)]);
export const realEstateMessageAttachments=pgTable("real_estate_message_attachments",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),messageId:text("message_id").notNull().references(()=>realEstateMessages.id,{onDelete:"cascade"}),documentId:text("document_id").notNull().references(()=>realEstateDocuments.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_message_attachments_idx").on(t.tenantId,t.messageId)]);

export const realEstateCommissionPlans=pgTable("real_estate_commission_plans",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),name:text("name").notNull(),calculationType:text("calculation_type").notNull(),rateBasisPoints:integer("rate_basis_points"),flatAmountCents:integer("flat_amount_cents"),brokerSplitBasisPoints:integer("broker_split_basis_points"),agentSplitBasisPoints:integer("agent_split_basis_points"),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[index("re_commission_plans_scope_idx").on(t.tenantId,t.organizationId)]);
export const realEstateTransactionCommissions=pgTable("real_estate_transaction_commissions",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),transactionId:text("transaction_id").notNull().references(()=>realEstateTransactions.id,{onDelete:"cascade"}),membershipId:text("membership_id").references(()=>realEstateMemberships.id),planId:text("plan_id").references(()=>realEstateCommissionPlans.id),snapshot:jsonb("snapshot").$type<Record<string,number|string>>().notNull(),grossCommissionCents:integer("gross_commission_cents").notNull(),brokerageShareCents:integer("brokerage_share_cents").notNull(),agentShareCents:integer("agent_share_cents").notNull(),estimatedNetCents:integer("estimated_net_cents").notNull(),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_tx_commission_scope_idx").on(t.tenantId,t.organizationId,t.transactionId),index("re_tx_commission_member_idx").on(t.membershipId)]);
export const realEstateCommissionAdjustments=pgTable("real_estate_commission_adjustments",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),transactionCommissionId:text("transaction_commission_id").notNull().references(()=>realEstateTransactionCommissions.id,{onDelete:"cascade"}),adjustmentType:text("adjustment_type").notNull(),amountCents:integer("amount_cents"),rateBasisPoints:integer("rate_basis_points"),description:text("description").notNull().default(""),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_commission_adjustments_idx").on(t.tenantId,t.transactionCommissionId)]);
export const realEstateAuditEvents=pgTable("real_estate_audit_events",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),actorType:text("actor_type").notNull(),actorMembershipId:text("actor_membership_id"),actorPortalUserId:text("actor_portal_user_id"),action:text("action").notNull(),resourceType:text("resource_type").notNull(),resourceId:text("resource_id").notNull(),transactionId:text("transaction_id"),safeMetadata:jsonb("safe_metadata").$type<Record<string,unknown>>().notNull().default({}),ipHash:text("ip_hash"),userAgentSummary:text("user_agent_summary"),occurredAt:timestamp("occurred_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_audit_scope_idx").on(t.tenantId,t.organizationId,t.occurredAt),index("re_audit_resource_idx").on(t.resourceType,t.resourceId),index("re_audit_transaction_idx").on(t.transactionId,t.occurredAt)]);

// ---------------------------------------------------------------------------
// Real Estate AI intelligence and human review (Phase 8)
// ---------------------------------------------------------------------------
export const realEstateAiSettings=pgTable("real_estate_ai_settings",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),enabled:boolean("enabled").notNull().default(false),features:jsonb("features").$type<Record<string,boolean>>().notNull().default({}),monthlyTenantLimit:integer("monthly_tenant_limit").notNull().default(500),dailyUserLimit:integer("daily_user_limit").notNull().default(25),humanApprovalRequired:boolean("human_approval_required").notNull().default(true),retentionDays:integer("retention_days").notNull().default(90),preferredLanguage:text("preferred_language").notNull().default("en"),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[unique("re_ai_settings_scope_unique").on(t.tenantId,t.organizationId),index("re_ai_settings_tenant_idx").on(t.tenantId)]);
export const realEstateAiPromptVersions=pgTable("real_estate_ai_prompt_versions",{id:text("id").primaryKey(),feature:text("feature").notNull(),promptKey:text("prompt_key").notNull(),version:integer("version").notNull(),contentHash:text("content_hash").notNull(),riskLevel:text("risk_level").notNull(),requiresReview:boolean("requires_review").notNull().default(true),allowedInputs:jsonb("allowed_inputs").$type<string[]>().notNull().default([]),outputSchemaKey:text("output_schema_key").notNull(),activatedAt:timestamp("activated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),retiredAt:timestamp("retired_at",{withTimezone:true,mode:"string"})},t=>[unique("re_ai_prompt_version_unique").on(t.promptKey,t.version),index("re_ai_prompt_feature_idx").on(t.feature,t.activatedAt)]);
export const realEstateAiRequests=pgTable("real_estate_ai_requests",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),requestedByMembershipId:text("requested_by_membership_id").references(()=>realEstateMemberships.id),portalUserId:text("portal_user_id").references(()=>realEstatePortalUsers.id),feature:text("feature").notNull(),status:text("status").notNull().default("draft"),provider:text("provider").notNull(),model:text("model").notNull(),promptVersionId:text("prompt_version_id").notNull().references(()=>realEstateAiPromptVersions.id),sourceType:text("source_type").notNull(),sourceId:text("source_id").notNull(),sourceHash:text("source_hash").notNull(),inputHash:text("input_hash").notNull(),idempotencyKey:text("idempotency_key").notNull(),estimatedInputTokens:integer("estimated_input_tokens").notNull().default(0),actualInputTokens:integer("actual_input_tokens").notNull().default(0),actualOutputTokens:integer("actual_output_tokens").notNull().default(0),estimatedCostMicros:integer("estimated_cost_micros").notNull().default(0),actualCostMicros:integer("actual_cost_micros").notNull().default(0),providerRequestId:text("provider_request_id"),queuedAt:timestamp("queued_at",{withTimezone:true,mode:"string"}),startedAt:timestamp("started_at",{withTimezone:true,mode:"string"}),completedAt:timestamp("completed_at",{withTimezone:true,mode:"string"}),failedAt:timestamp("failed_at",{withTimezone:true,mode:"string"}),cancelledAt:timestamp("cancelled_at",{withTimezone:true,mode:"string"}),safeErrorCode:text("safe_error_code"),safeErrorMessage:text("safe_error_message"),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[unique("re_ai_request_idempotency_unique").on(t.tenantId,t.idempotencyKey),index("re_ai_requests_scope_idx").on(t.tenantId,t.organizationId,t.createdAt),index("re_ai_requests_source_idx").on(t.tenantId,t.sourceType,t.sourceId),index("re_ai_requests_feature_idx").on(t.tenantId,t.feature,t.createdAt),index("re_ai_requests_status_idx").on(t.status,t.createdAt),index("re_ai_requests_member_idx").on(t.requestedByMembershipId,t.createdAt)]);
export const realEstateAiResults=pgTable("real_estate_ai_results",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),requestId:text("request_id").notNull().references(()=>realEstateAiRequests.id,{onDelete:"cascade"}),resultType:text("result_type").notNull(),structuredPayload:jsonb("structured_payload").$type<Record<string,unknown>>().notNull().default({}),renderedText:text("rendered_text").notNull().default(""),confidence:integer("confidence").notNull().default(0),requiresReview:boolean("requires_review").notNull().default(true),sourceReferences:jsonb("source_references").$type<Array<Record<string,unknown>>>().notNull().default([]),approvedAt:timestamp("approved_at",{withTimezone:true,mode:"string"}),approvedByMembershipId:text("approved_by_membership_id").references(()=>realEstateMemberships.id),rejectedAt:timestamp("rejected_at",{withTimezone:true,mode:"string"}),rejectedByMembershipId:text("rejected_by_membership_id").references(()=>realEstateMemberships.id),rejectionReason:text("rejection_reason"),appliedAt:timestamp("applied_at",{withTimezone:true,mode:"string"}),staleAt:timestamp("stale_at",{withTimezone:true,mode:"string"}),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[index("re_ai_results_request_idx").on(t.tenantId,t.requestId),index("re_ai_results_review_idx").on(t.tenantId,t.requiresReview,t.approvedAt,t.rejectedAt)]);
export const realEstateAiUsageDaily=pgTable("real_estate_ai_usage_daily",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),membershipId:text("membership_id").references(()=>realEstateMemberships.id),day:text("day").notNull(),feature:text("feature").notNull(),provider:text("provider").notNull(),model:text("model").notNull(),requestCount:integer("request_count").notNull().default(0),successCount:integer("success_count").notNull().default(0),failureCount:integer("failure_count").notNull().default(0),blockedCount:integer("blocked_count").notNull().default(0),inputTokens:integer("input_tokens").notNull().default(0),outputTokens:integer("output_tokens").notNull().default(0),estimatedCostMicros:integer("estimated_cost_micros").notNull().default(0),actualCostMicros:integer("actual_cost_micros").notNull().default(0),latencyMsTotal:integer("latency_ms_total").notNull().default(0),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_ai_usage_daily_unique").on(t.tenantId,t.membershipId,t.day,t.feature,t.provider,t.model),index("re_ai_usage_scope_idx").on(t.tenantId,t.organizationId,t.day),index("re_ai_usage_member_idx").on(t.membershipId,t.day)]);
export const realEstateAiFeedback=pgTable("real_estate_ai_feedback",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),requestId:text("request_id").notNull().references(()=>realEstateAiRequests.id),resultId:text("result_id").notNull().references(()=>realEstateAiResults.id),feature:text("feature").notNull(),rating:text("rating").notNull(),comment:text("comment"),actorMembershipId:text("actor_membership_id").notNull().references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_ai_feedback_actor_unique").on(t.resultId,t.actorMembershipId),index("re_ai_feedback_scope_idx").on(t.tenantId,t.feature,t.createdAt)]);
export const realEstateLeadScores=pgTable("real_estate_lead_scores",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),leadId:text("lead_id").notNull().references(()=>realEstateLeads.id,{onDelete:"cascade"}),requestId:text("request_id").references(()=>realEstateAiRequests.id),score:integer("score").notNull(),grade:text("grade").notNull(),confidence:integer("confidence").notNull(),factors:jsonb("factors").$type<Array<Record<string,unknown>>>().notNull().default([]),missingSignals:jsonb("missing_signals").$type<string[]>().notNull().default([]),suggestedNextAction:text("suggested_next_action"),sourceHash:text("source_hash").notNull(),isManualOverride:boolean("is_manual_override").notNull().default(false),overrideReason:text("override_reason"),overriddenByMembershipId:text("overridden_by_membership_id").references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_lead_scores_scope_idx").on(t.tenantId,t.organizationId,t.leadId,t.createdAt),index("re_lead_scores_request_idx").on(t.requestId)]);
export const realEstateDocumentExtractions=pgTable("real_estate_document_extractions",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),documentId:text("document_id").notNull().references(()=>realEstateDocuments.id,{onDelete:"cascade"}),requestId:text("request_id").notNull().references(()=>realEstateAiRequests.id),suggestedDocumentType:text("suggested_document_type").notNull(),classificationConfidence:integer("classification_confidence").notNull(),status:text("status").notNull().default("pending_review"),sourceVersionId:text("source_version_id").references(()=>realEstateDocumentVersions.id),sourceHash:text("source_hash").notNull(),approvedAt:timestamp("approved_at",{withTimezone:true,mode:"string"}),approvedByMembershipId:text("approved_by_membership_id").references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_doc_extractions_scope_idx").on(t.tenantId,t.organizationId,t.documentId,t.createdAt),index("re_doc_extractions_request_idx").on(t.requestId)]);
export const realEstateDocumentExtractionFields=pgTable("real_estate_document_extraction_fields",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),extractionId:text("extraction_id").notNull().references(()=>realEstateDocumentExtractions.id,{onDelete:"cascade"}),fieldKey:text("field_key").notNull(),value:jsonb("value").$type<unknown>(),confidence:integer("confidence").notNull(),sourcePage:integer("source_page"),sourceStart:integer("source_start"),sourceEnd:integer("source_end"),selectedForApply:boolean("selected_for_apply").notNull().default(false),appliedAt:timestamp("applied_at",{withTimezone:true,mode:"string"}),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_doc_extraction_field_unique").on(t.extractionId,t.fieldKey),index("re_doc_extraction_fields_idx").on(t.tenantId,t.extractionId)]);
export const realEstateAiHealthChecks=pgTable("real_estate_ai_health_checks",{id:text("id").primaryKey(),provider:text("provider").notNull(),model:text("model").notNull(),status:text("status").notNull(),checkedAt:timestamp("checked_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),lastSuccessAt:timestamp("last_success_at",{withTimezone:true,mode:"string"}),lastFailureAt:timestamp("last_failure_at",{withTimezone:true,mode:"string"}),latencyMs:integer("latency_ms"),safeFailureCode:text("safe_failure_code"),safeFailureMessage:text("safe_failure_message")},t=>[index("re_ai_health_provider_idx").on(t.provider,t.model,t.checkedAt)]);

// Phase 9 enterprise hierarchy and external integration infrastructure.
export const realEstateEnterpriseNodes=pgTable("real_estate_enterprise_nodes",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),parentId:text("parent_id"),nodeType:text("node_type").notNull(),externalId:text("external_id").notNull(),name:text("name").notNull(),code:text("code"),timezone:text("timezone").notNull().default("America/New_York"),metadata:jsonb("metadata").$type<Record<string,unknown>>().notNull().default({}),isActive:boolean("is_active").notNull().default(true),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[index("re_enterprise_nodes_scope_idx").on(t.tenantId,t.organizationId,t.nodeType),index("re_enterprise_nodes_parent_idx").on(t.tenantId,t.parentId),unique("re_enterprise_nodes_external_unique").on(t.tenantId,t.externalId)]);
export const realEstateEnterpriseAssignments=pgTable("real_estate_enterprise_assignments",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),nodeId:text("node_id").notNull().references(()=>realEstateEnterpriseNodes.id),membershipId:text("membership_id").notNull().references(()=>realEstateMemberships.id),enterpriseRole:text("enterprise_role").notNull(),inheritsToChildren:boolean("inherits_to_children").notNull().default(false),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[unique("re_enterprise_assignment_unique").on(t.tenantId,t.nodeId,t.membershipId,t.enterpriseRole),index("re_enterprise_assignment_member_idx").on(t.tenantId,t.membershipId)]);
export const realEstateApiKeys=pgTable("real_estate_api_keys",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),externalId:text("external_id").notNull(),name:text("name").notNull(),keyPrefix:text("key_prefix").notNull(),secretHash:text("secret_hash").notNull(),scopes:jsonb("scopes").$type<string[]>().notNull().default([]),ipAllowlist:jsonb("ip_allowlist").$type<string[]>().notNull().default([]),requestsPerMinute:integer("requests_per_minute").notNull().default(60),monthlyQuota:integer("monthly_quota").notNull().default(10000),usageMonth:text("usage_month"),usageCount:integer("usage_count").notNull().default(0),lastUsedAt:timestamp("last_used_at",{withTimezone:true,mode:"string"}),expiresAt:timestamp("expires_at",{withTimezone:true,mode:"string"}),revokedAt:timestamp("revoked_at",{withTimezone:true,mode:"string"}),createdByMembershipId:text("created_by_membership_id").references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_api_keys_external_unique").on(t.externalId),uniqueIndex("re_api_keys_prefix_idx").on(t.keyPrefix),index("re_api_keys_scope_idx").on(t.tenantId,t.organizationId)]);
export const realEstateOauthClients=pgTable("real_estate_oauth_clients",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),clientId:text("client_id").notNull(),clientSecretHash:text("client_secret_hash").notNull(),name:text("name").notNull(),redirectUris:jsonb("redirect_uris").$type<string[]>().notNull().default([]),scopes:jsonb("scopes").$type<string[]>().notNull().default([]),isConfidential:boolean("is_confidential").notNull().default(true),createdByMembershipId:text("created_by_membership_id").references(()=>realEstateMemberships.id),revokedAt:timestamp("revoked_at",{withTimezone:true,mode:"string"}),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[uniqueIndex("re_oauth_clients_client_idx").on(t.clientId),index("re_oauth_clients_scope_idx").on(t.tenantId,t.organizationId)]);
export const realEstateOauthGrants=pgTable("real_estate_oauth_grants",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),clientId:text("client_id").notNull().references(()=>realEstateOauthClients.clientId),membershipId:text("membership_id").notNull().references(()=>realEstateMemberships.id),grantType:text("grant_type").notNull(),tokenHash:text("token_hash").notNull(),familyId:text("family_id").notNull(),scopes:jsonb("scopes").$type<string[]>().notNull().default([]),redirectUri:text("redirect_uri"),expiresAt:timestamp("expires_at",{withTimezone:true,mode:"string"}).notNull(),usedAt:timestamp("used_at",{withTimezone:true,mode:"string"}),revokedAt:timestamp("revoked_at",{withTimezone:true,mode:"string"}),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[uniqueIndex("re_oauth_grants_token_idx").on(t.tokenHash),index("re_oauth_grants_family_idx").on(t.tenantId,t.familyId)]);
export const realEstateOutboundWebhookSubscriptions=pgTable("real_estate_outbound_webhook_subscriptions",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),externalId:text("external_id").notNull(),url:text("url").notNull(),secretHash:text("secret_hash").notNull(),encryptedSigningSecret:text("encrypted_signing_secret").notNull(),events:jsonb("events").$type<string[]>().notNull().default([]),isActive:boolean("is_active").notNull().default(true),createdByMembershipId:text("created_by_membership_id").references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[unique("re_outbound_webhooks_external_unique").on(t.tenantId,t.externalId),index("re_outbound_webhooks_scope_idx").on(t.tenantId,t.organizationId)]);
export const realEstateOutboundWebhookDeliveries=pgTable("real_estate_outbound_webhook_deliveries",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),subscriptionId:text("subscription_id").notNull().references(()=>realEstateOutboundWebhookSubscriptions.id),eventId:text("event_id").notNull(),eventType:text("event_type").notNull(),payload:jsonb("payload").$type<Record<string,unknown>>().notNull(),payloadHash:text("payload_hash").notNull(),status:text("status").notNull().default("pending"),attemptCount:integer("attempt_count").notNull().default(0),responseStatus:integer("response_status"),safeError:text("safe_error"),nextAttemptAt:timestamp("next_attempt_at",{withTimezone:true,mode:"string"}),deliveredAt:timestamp("delivered_at",{withTimezone:true,mode:"string"}),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_outbound_delivery_event_unique").on(t.subscriptionId,t.eventId),index("re_outbound_delivery_queue_idx").on(t.tenantId,t.status,t.nextAttemptAt)]);
export const realEstateImportExportJobs=pgTable("real_estate_import_export_jobs",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),externalId:text("external_id").notNull(),direction:text("direction").notNull(),resourceType:text("resource_type").notNull(),format:text("format").notNull(),status:text("status").notNull().default("preview"),blobUrl:text("blob_url"),cursor:integer("cursor").notNull().default(0),totalRows:integer("total_rows").notNull().default(0),processedRows:integer("processed_rows").notNull().default(0),failedRows:integer("failed_rows").notNull().default(0),duplicateRows:integer("duplicate_rows").notNull().default(0),mapping:jsonb("mapping").$type<Record<string,string>>().notNull().default({}),safeErrors:jsonb("safe_errors").$type<Array<Record<string,unknown>>>().notNull().default([]),idempotencyKey:text("idempotency_key").notNull(),createdByMembershipId:text("created_by_membership_id").references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),completedAt:timestamp("completed_at",{withTimezone:true,mode:"string"}),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[unique("re_import_export_idempotency_unique").on(t.tenantId,t.idempotencyKey),unique("re_import_export_external_unique").on(t.tenantId,t.externalId),index("re_import_export_queue_idx").on(t.tenantId,t.status,t.createdAt)]);
export const realEstateExternalIdentifiers=pgTable("real_estate_external_identifiers",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),resourceType:text("resource_type").notNull(),resourceId:text("resource_id").notNull(),externalId:text("external_id").notNull(),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_external_identifier_resource_unique").on(t.tenantId,t.resourceType,t.resourceId),uniqueIndex("re_external_identifier_public_unique").on(t.externalId)]);
export const realEstateOperationalMetrics=pgTable("real_estate_operational_metrics",{id:text("id").primaryKey(),tenantId:text("tenant_id"),organizationId:text("organization_id"),metric:text("metric").notNull(),dimensions:jsonb("dimensions").$type<Record<string,string>>().notNull().default({}),value:integer("value").notNull(),occurredAt:timestamp("occurred_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_operational_metrics_scope_idx").on(t.tenantId,t.metric,t.occurredAt)]);
export const realEstateBackupVerifications=pgTable("real_estate_backup_verifications",{id:text("id").primaryKey(),environment:text("environment").notNull(),backupReferenceHash:text("backup_reference_hash").notNull(),databaseStatus:text("database_status").notNull(),blobStatus:text("blob_status").notNull(),integrityStatus:text("integrity_status").notNull(),safeReport:jsonb("safe_report").$type<Record<string,unknown>>().notNull().default({}),verifiedBy:text("verified_by").notNull(),verifiedAt:timestamp("verified_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_backup_verification_idx").on(t.environment,t.verifiedAt)]);
export const realEstateEnterpriseResourceScopes=pgTable("real_estate_enterprise_resource_scopes",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),nodeId:text("node_id").notNull().references(()=>realEstateEnterpriseNodes.id),resourceType:text("resource_type").notNull(),resourceId:text("resource_id").notNull(),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_enterprise_resource_scope_unique").on(t.tenantId,t.resourceType,t.resourceId),index("re_enterprise_resource_node_idx").on(t.tenantId,t.nodeId,t.resourceType)]);
export const realEstateIntegrationInstallations=pgTable("real_estate_integration_installations",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),externalId:text("external_id").notNull(),providerKey:text("provider_key").notNull(),displayName:text("display_name").notNull(),status:text("status").notNull().default("configured"),scopes:jsonb("scopes").$type<string[]>().notNull().default([]),safeConfiguration:jsonb("safe_configuration").$type<Record<string,unknown>>().notNull().default({}),credentialReference:text("credential_reference"),createdByMembershipId:text("created_by_membership_id").references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[unique("re_integration_install_external_unique").on(t.tenantId,t.externalId),unique("re_integration_install_provider_unique").on(t.tenantId,t.organizationId,t.providerKey)]);

// Phase 10 marketplace, MLS/IDX, white-label, licensing, and platform administration.
// Provider capability/version catalog is code (lib/real-estate/marketplace/types.ts), not a
// table; realEstateIntegrationInstallations (above) already carries per-tenant install state.
export const realEstateMlsSyncCursors=pgTable("real_estate_mls_sync_cursors",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),installationId:text("installation_id").notNull().references(()=>realEstateIntegrationInstallations.id,{onDelete:"cascade"}),providerKey:text("provider_key").notNull(),syncType:text("sync_type").notNull(),cursor:text("cursor"),status:text("status").notNull().default("idle"),recordsProcessed:integer("records_processed").notNull().default(0),lastRunAt:timestamp("last_run_at",{withTimezone:true,mode:"string"}),lastSuccessAt:timestamp("last_success_at",{withTimezone:true,mode:"string"}),lastErrorCode:text("last_error_code"),lastErrorMessage:text("last_error_message"),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_mls_cursor_unique").on(t.tenantId,t.installationId,t.syncType),index("re_mls_cursor_tenant_idx").on(t.tenantId,t.organizationId)]);
export const realEstateMlsEntityMappings=pgTable("real_estate_mls_entity_mappings",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),installationId:text("installation_id").notNull().references(()=>realEstateIntegrationInstallations.id,{onDelete:"cascade"}),entityType:text("entity_type").notNull(),internalId:text("internal_id").notNull(),externalId:text("external_id").notNull(),externalUpdatedAt:timestamp("external_updated_at",{withTimezone:true,mode:"string"}),conflictStatus:text("conflict_status").notNull().default("none"),conflictDetails:jsonb("conflict_details").$type<Record<string,unknown>>().notNull().default({}),lastSyncedAt:timestamp("last_synced_at",{withTimezone:true,mode:"string"}),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_mls_mapping_external_unique").on(t.tenantId,t.installationId,t.entityType,t.externalId),index("re_mls_mapping_internal_idx").on(t.tenantId,t.installationId,t.entityType,t.internalId)]);
export const realEstateTenantBranding=pgTable("real_estate_tenant_branding",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),logoUrl:text("logo_url"),faviconUrl:text("favicon_url"),primaryColor:text("primary_color"),secondaryColor:text("secondary_color"),accentColor:text("accent_color"),fontFamily:text("font_family"),emailFromName:text("email_from_name"),emailLogoUrl:text("email_logo_url"),loginHeadline:text("login_headline"),portalHeadline:text("portal_headline"),pwaName:text("pwa_name"),pwaThemeColor:text("pwa_theme_color"),isActive:boolean("is_active").notNull().default(true),updatedByMembershipId:text("updated_by_membership_id").references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_tenant_branding_scope_unique").on(t.tenantId,t.organizationId)]);
export const realEstateCustomDomains=pgTable("real_estate_custom_domains",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),organizationId:text("organization_id").notNull(),domain:text("domain").notNull(),verificationToken:text("verification_token").notNull(),verificationMethod:text("verification_method").notNull().default("dns_txt"),status:text("status").notNull().default("pending"),verifiedAt:timestamp("verified_at",{withTimezone:true,mode:"string"}),lastCheckedAt:timestamp("last_checked_at",{withTimezone:true,mode:"string"}),createdByMembershipId:text("created_by_membership_id").references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),deletedAt:timestamp("deleted_at",{withTimezone:true,mode:"string"})},t=>[uniqueIndex("re_custom_domain_unique").on(t.domain),index("re_custom_domain_tenant_idx").on(t.tenantId,t.organizationId)]);
export const realEstateTenantLicenses=pgTable("real_estate_tenant_licenses",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),feature:text("feature").notNull(),isEnabled:boolean("is_enabled").notNull().default(false),limits:jsonb("limits").$type<Record<string,number>>().notNull().default({}),grantedByMembershipId:text("granted_by_membership_id").references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[unique("re_tenant_license_unique").on(t.tenantId,t.feature),index("re_tenant_license_tenant_idx").on(t.tenantId)]);
export const realEstateTenantLifecycleEvents=pgTable("real_estate_tenant_lifecycle_events",{id:text("id").primaryKey(),tenantId:text("tenant_id").notNull(),eventType:text("event_type").notNull(),reason:text("reason"),actorEmail:text("actor_email").notNull(),safeMetadata:jsonb("safe_metadata").$type<Record<string,unknown>>().notNull().default({}),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[index("re_tenant_lifecycle_tenant_idx").on(t.tenantId,t.createdAt)]);
export const realEstateFeatureRollouts=pgTable("real_estate_feature_rollouts",{id:text("id").primaryKey(),featureKey:text("feature_key").notNull(),strategy:text("strategy").notNull().default("off"),rolloutPercentage:integer("rollout_percentage").notNull().default(0),allowlistTenantIds:jsonb("allowlist_tenant_ids").$type<string[]>().notNull().default([]),isActive:boolean("is_active").notNull().default(true),updatedByMembershipId:text("updated_by_membership_id").references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[uniqueIndex("re_feature_rollout_key_unique").on(t.featureKey)]);
export const realEstatePlatformAnnouncements=pgTable("real_estate_platform_announcements",{id:text("id").primaryKey(),externalId:text("external_id").notNull(),title:text("title").notNull(),body:text("body").notNull(),severity:text("severity").notNull().default("info"),audience:text("audience").notNull().default("all"),tenantId:text("tenant_id"),publishedAt:timestamp("published_at",{withTimezone:true,mode:"string"}).notNull().defaultNow(),expiresAt:timestamp("expires_at",{withTimezone:true,mode:"string"}),createdByMembershipId:text("created_by_membership_id").references(()=>realEstateMemberships.id),createdAt:timestamp("created_at",{withTimezone:true,mode:"string"}).notNull().defaultNow()},t=>[uniqueIndex("re_announcement_external_unique").on(t.externalId),index("re_announcement_audience_idx").on(t.audience,t.tenantId,t.publishedAt)]);

// ---------------------------------------------------------------------------
// Lucio Financial Copilot (LFC)
// All money stored as INTEGER CENTS. Soft-delete only — tax records must stay
// reconstructable. Categories are data rows so trades/verticals can differ.
// ---------------------------------------------------------------------------

export const taxProfiles = pgTable(
  "tax_profiles",
  {
    id: text("id").primaryKey(),
    contractorId: text("contractor_id").notNull(),
    /** sole_prop | llc_single | llc_multi | s_corp */
    entityType: text("entity_type").notNull().default("llc_single"),
    /** Percent of net the owner chooses to set aside. Owner-configurable. */
    setAsidePercent: real("set_aside_percent").notNull().default(25),
    businessLegalName: text("business_legal_name"),
    taxYearStartMonth: integer("tax_year_start_month").notNull().default(1),
    /** Dollar amount at which the app flags a payee for 1099 review. Owner-configurable — confirm the current threshold with an accountant. */
    payeeAlertThresholdCents: integer("payee_alert_threshold_cents").notNull().default(60000),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("tax_profiles_contractor_idx").on(t.contractorId)]
);

export const expenseCategories = pgTable(
  "expense_categories",
  {
    id: text("id").primaryKey(),
    /** null = system default available to everyone; set = custom to one contractor */
    contractorId: text("contractor_id"),
    key: text("key").notNull(),
    labelEn: text("label_en").notNull(),
    labelEs: text("label_es").notNull(),
    /** Schedule C line reference, e.g. "9". Internal mapping only. */
    scheduleCLine: text("schedule_c_line"),
    /** "true" when this is typically a billable job-material category */
    isJobMaterial: text("is_job_material").notNull().default("false"),
    sortOrder: integer("sort_order").notNull().default(100),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [index("expense_categories_contractor_idx").on(t.contractorId)]
);

export const expenses = pgTable(
  "expenses",
  {
    id: text("id").primaryKey(),
    contractorId: text("contractor_id").notNull(),
    /** SET = job material (billable to that lead). NULL = business overhead (deductible). */
    leadId: text("lead_id"),
    /** SET when this expense was a payment to a subcontractor/vendor tracked for 1099 purposes. */
    payeeId: text("payee_id"),
    categoryId: text("category_id").notNull(),
    /** INTEGER CENTS. 4611.00 -> 461100 */
    amountCents: integer("amount_cents").notNull(),
    /** YYYY-MM-DD */
    spentOn: text("spent_on").notNull(),
    vendor: text("vendor").notNull().default(""),
    note: text("note").notNull().default(""),
    /** Vercel Blob URL in production, data URL fallback locally — same as photos.dataUrl */
    receiptUrl: text("receipt_url"),
    receiptFilename: text("receipt_filename"),
    billedToClient: text("billed_to_client").notNull().default("false"),
    /** SOFT DELETE ONLY — never hard-delete a financial record */
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("expenses_contractor_idx").on(t.contractorId),
    index("expenses_lead_idx").on(t.leadId),
    index("expenses_spent_on_idx").on(t.spentOn),
  ]
);

// ---------------------------------------------------------------------------
// LFC Delivery 2 — 1099 tracking, both directions.
//
// SECURITY NOTE: full TINs (SSN/EIN) are deliberately NOT stored. Only the
// TIN type and last 4 digits are kept, for identification. The actual number
// lives on the uploaded W-9 document, which is what an accountant needs.
// Storing raw SSNs in a queryable column would make this database a target.
// ---------------------------------------------------------------------------

export const payees = pgTable(
  "payees",
  {
    id: text("id").primaryKey(),
    contractorId: text("contractor_id").notNull(),
    name: text("name").notNull(),
    /** individual | business */
    payeeType: text("payee_type").notNull().default("individual"),
    legalName: text("legal_name"),
    address: text("address"),
    /** ssn | ein | unknown — the TYPE only, never the number */
    tinType: text("tin_type").notNull().default("unknown"),
    /** Last 4 digits only, for identification. Never the full TIN. */
    tinLast4: text("tin_last4"),
    /** "true" once a W-9 has been collected */
    w9OnFile: text("w9_on_file").notNull().default("false"),
    w9ReceivedOn: text("w9_received_on"),
    /** Blob URL of the W-9 document — same pipeline as receipts */
    w9DocUrl: text("w9_doc_url"),
    w9DocFilename: text("w9_doc_filename"),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    notes: text("notes").notNull().default(""),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("payees_contractor_idx").on(t.contractorId)]
);

/** 1099s the contractor RECEIVES from clients/GCs, to reconcile against his own records. */
export const forms1099Received = pgTable(
  "forms_1099_received",
  {
    id: text("id").primaryKey(),
    contractorId: text("contractor_id").notNull(),
    taxYear: integer("tax_year").notNull(),
    issuerName: text("issuer_name").notNull(),
    /** 1099-NEC | 1099-MISC | 1099-K | other */
    formType: text("form_type").notNull().default("1099-NEC"),
    amountCents: integer("amount_cents").notNull(),
    docUrl: text("doc_url"),
    docFilename: text("doc_filename"),
    notes: text("notes").notNull().default(""),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("forms1099_contractor_year_idx").on(t.contractorId, t.taxYear)]
);

// ---------------------------------------------------------------------------
// LFC Delivery 3 — money the owner actually moved into a tax set-aside.
// This is a RECORD of what he did, not a tax payment or a filing.
// ---------------------------------------------------------------------------

export const taxSetAsides = pgTable(
  "tax_setasides",
  {
    id: text("id").primaryKey(),
    contractorId: text("contractor_id").notNull(),
    taxYear: integer("tax_year").notNull(),
    /** 1..4 */
    quarter: integer("quarter").notNull(),
    amountCents: integer("amount_cents").notNull(),
    /** YYYY-MM-DD the money was moved/paid */
    movedOn: text("moved_on").notNull(),
    note: text("note").notNull().default(""),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("setasides_contractor_year_idx").on(t.contractorId, t.taxYear)]
);
