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
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [index("real_estate_reminders_tenant_date_idx").on(t.tenantId, t.remindAt), index("real_estate_reminders_agent_idx").on(t.assignedAgentId)]
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
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    channel: text("channel").notNull(),
    recipient: text("recipient").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    status: text("status").notNull().default("queued"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: "string" }),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "string" }),
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => [index("real_estate_communications_tenant_idx").on(t.tenantId), index("real_estate_communications_status_idx").on(t.tenantId, t.status)]
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
