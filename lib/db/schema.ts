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
