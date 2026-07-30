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
