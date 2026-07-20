// ---------------------------------------------------------------------------
// Postgres store (Neon-ready via standard PG protocol). Same interface as the
// JSON store — API routes never know which backend is live.
// Photos: if BLOB_READ_WRITE_TOKEN is set, data URLs are uploaded to Vercel
// Blob and only the URL is persisted; otherwise the data URL is stored as-is.
// ---------------------------------------------------------------------------

import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, desc } from "drizzle-orm";
import { contractors, leads, photos, estimates } from "./db/schema";
import type { Lead, LeadStatus, AiSummary, Contractor, Estimate, Photo, Payment, PaymentMethods } from "./types";

let _db: NodePgDatabase | null = null;

function db(): NodePgDatabase {
  if (!_db) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost") ? undefined : { rejectUnauthorized: false },
      max: 5,
    });
    _db = drizzle(pool);
  }
  return _db;
}

async function maybeUploadToBlob(photo: { dataUrl: string; filename: string }, leadId: string): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !photo.dataUrl.startsWith("data:")) {
    return photo.dataUrl;
  }
  try {
    const { put } = await import("@vercel/blob");
    const [meta, b64] = photo.dataUrl.split(",");
    const mime = meta.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
    const buffer = Buffer.from(b64, "base64");
    const blob = await put(`snaplink/${leadId}/${Date.now()}-${photo.filename}`, buffer, {
      access: "public",
      contentType: mime,
    });
    return blob.url;
  } catch {
    // Blob upload failed — fall back to storing the data URL so no lead is lost.
    return photo.dataUrl;
  }
}

type LeadRow = typeof leads.$inferSelect;
type PhotoRow = typeof photos.$inferSelect;
type ContractorRow = typeof contractors.$inferSelect;
type EstimateRow = typeof estimates.$inferSelect;

function rowToLead(row: LeadRow, photoRows: PhotoRow[]): Lead {
  return {
    id: row.id,
    contractorId: row.contractorId,
    contractorUsername: row.contractorUsername,
    source: row.source as Lead["source"],
    status: row.status as LeadStatus,
    language: row.language as Lead["language"],
    clientName: row.clientName,
    phone: row.phone,
    email: row.email,
    projectAddress: row.projectAddress,
    preferredContact: row.preferredContact as Lead["preferredContact"],
    bestTimeToContact: row.bestTimeToContact,
    projectType: row.projectType,
    timeline: row.timeline,
    budgetRange: row.budgetRange,
    notes: row.notes,
    answers: row.answers ?? {},
    tags: row.tags ?? [],
    ai: (row.ai as AiSummary | null) ?? undefined,
    payments: (row.payments as Payment[] | null) ?? [],
    photos: photoRows.map(
      (p): Photo => ({
        id: p.id,
        leadId: p.leadId,
        kind: p.kind as Photo["kind"],
        dataUrl: p.dataUrl,
        filename: p.filename,
        createdAt: p.createdAt,
      })
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToContractor(row: ContractorRow): Contractor {
  return {
    id: row.id,
    username: row.username,
    payments: (row.payments as PaymentMethods | null) ?? undefined,
    pin: row.pin ?? undefined,
    preferredLanguage: row.preferredLanguage as Contractor["preferredLanguage"],
    businessName: row.businessName,
    ownerName: row.ownerName,
    phone: row.phone,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email,
    serviceArea: row.serviceArea,
    services: row.services ?? [],
    tagline: row.tagline ?? undefined,
    licenseInfo: row.licenseInfo ?? undefined,
    reviewsUrl: row.reviewsUrl ?? undefined,
    galleryUrl: row.galleryUrl ?? undefined,
    brandColor: row.brandColor ?? undefined,
    createdAt: row.createdAt,
  };
}

function rowToEstimate(row: EstimateRow): Estimate {
  return {
    id: row.id,
    leadId: row.leadId,
    contractorId: row.contractorId,
    status: row.status as Estimate["status"],
    lineItems: (row.lineItems as Estimate["lineItems"]) ?? [],
    taxRate: row.taxRate,
    discount: row.discount,
    depositPercent: row.depositPercent,
    notes: row.notes,
    validDays: row.validDays,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function photosForLeads(leadIds: string[]): Promise<Map<string, PhotoRow[]>> {
  const map = new Map<string, PhotoRow[]>();
  if (leadIds.length === 0) return map;
  const rows = await db().select().from(photos);
  for (const r of rows) {
    if (!leadIds.includes(r.leadId)) continue;
    const arr = map.get(r.leadId) ?? [];
    arr.push(r);
    map.set(r.leadId, arr);
  }
  return map;
}

export const pgLeadStore = {
  async list(contractorUsername?: string): Promise<Lead[]> {
    const rows = contractorUsername
      ? await db().select().from(leads).where(eq(leads.contractorUsername, contractorUsername)).orderBy(desc(leads.createdAt))
      : await db().select().from(leads).orderBy(desc(leads.createdAt));
    const photoMap = await photosForLeads(rows.map((r) => r.id));
    return rows.map((r) => rowToLead(r, photoMap.get(r.id) ?? []));
  },

  async get(id: string): Promise<Lead | undefined> {
    const rows = await db().select().from(leads).where(eq(leads.id, id)).limit(1);
    if (!rows[0]) return undefined;
    const photoRows = await db().select().from(photos).where(eq(photos.leadId, id));
    return rowToLead(rows[0], photoRows);
  },

  async create(lead: Lead): Promise<Lead> {
    await db().insert(leads).values({
      id: lead.id,
      contractorId: lead.contractorId,
      contractorUsername: lead.contractorUsername,
      source: lead.source,
      status: lead.status,
      language: lead.language,
      clientName: lead.clientName,
      phone: lead.phone,
      email: lead.email,
      projectAddress: lead.projectAddress,
      preferredContact: lead.preferredContact,
      bestTimeToContact: lead.bestTimeToContact,
      projectType: lead.projectType,
      timeline: lead.timeline,
      budgetRange: lead.budgetRange,
      notes: lead.notes,
      answers: lead.answers,
      tags: lead.tags,
      payments: lead.payments ?? [],
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    });
    for (const p of lead.photos) {
      const url = await maybeUploadToBlob(p, lead.id);
      await db().insert(photos).values({
        id: p.id,
        leadId: lead.id,
        kind: p.kind,
        dataUrl: url,
        filename: p.filename,
        createdAt: p.createdAt,
      });
    }
    return lead;
  },

  async updateStatus(id: string, status: LeadStatus): Promise<Lead | undefined> {
    await db().update(leads).set({ status, updatedAt: new Date().toISOString() }).where(eq(leads.id, id));
    return this.get(id);
  },

  async attachAi(id: string, ai: AiSummary): Promise<Lead | undefined> {
    await db().update(leads).set({ ai, updatedAt: new Date().toISOString() }).where(eq(leads.id, id));
    return this.get(id);
  },
  async recordPayment(id: string, payment: Payment): Promise<Lead | undefined> {
    const lead = await this.get(id);
    if (!lead) return undefined;
    const next = [...(lead.payments ?? []), payment];
    await db().update(leads).set({ payments: next, updatedAt: new Date().toISOString() }).where(eq(leads.id, id));
    return this.get(id);
  },
  async removePayment(id: string, paymentId: string): Promise<Lead | undefined> {
    const lead = await this.get(id);
    if (!lead) return undefined;
    const next = (lead.payments ?? []).filter((p) => p.id !== paymentId);
    await db().update(leads).set({ payments: next, updatedAt: new Date().toISOString() }).where(eq(leads.id, id));
    return this.get(id);
  },
};

export const pgContractorStore = {
  async list(): Promise<Contractor[]> {
    const rows = await db().select().from(contractors).orderBy(contractors.createdAt);
    return rows.map(rowToContractor);
  },
  async getByUsername(username: string): Promise<Contractor | undefined> {
    const rows = await db().select().from(contractors).where(eq(contractors.username, username.toLowerCase())).limit(1);
    return rows[0] ? rowToContractor(rows[0]) : undefined;
  },
  async getById(id: string): Promise<Contractor | undefined> {
    const rows = await db().select().from(contractors).where(eq(contractors.id, id)).limit(1);
    return rows[0] ? rowToContractor(rows[0]) : undefined;
  },
  async create(c: Contractor): Promise<Contractor> {
    const existing = await this.getByUsername(c.username);
    if (existing) throw new Error(`Username "${c.username}" is already taken`);
    await db().insert(contractors).values({
      id: c.id,
      username: c.username,
      payments: c.payments ?? null,
      pin: c.pin ?? null,
      preferredLanguage: c.preferredLanguage,
      businessName: c.businessName,
      ownerName: c.ownerName,
      phone: c.phone,
      whatsapp: c.whatsapp ?? null,
      email: c.email,
      serviceArea: c.serviceArea,
      services: c.services,
      tagline: c.tagline ?? null,
      licenseInfo: c.licenseInfo ?? null,
      reviewsUrl: c.reviewsUrl ?? null,
      galleryUrl: c.galleryUrl ?? null,
      brandColor: c.brandColor ?? null,
      createdAt: c.createdAt,
    });
    return c;
  },
  async update(
    id: string,
    patch: Partial<Pick<Contractor, "pin" | "preferredLanguage" | "payments">>
  ): Promise<Contractor | undefined> {
    const set: Record<string, unknown> = {};
    if (patch.pin !== undefined) set.pin = patch.pin;
    if (patch.preferredLanguage !== undefined) set.preferredLanguage = patch.preferredLanguage;
    if (patch.payments !== undefined) set.payments = patch.payments;
    if (Object.keys(set).length > 0) {
      await db().update(contractors).set(set).where(eq(contractors.id, id));
    }
    return this.getById(id);
  },
};

export const pgEstimateStore = {
  async getByLead(leadId: string): Promise<Estimate | undefined> {
    const rows = await db().select().from(estimates).where(eq(estimates.leadId, leadId)).limit(1);
    return rows[0] ? rowToEstimate(rows[0]) : undefined;
  },
  async upsert(estimate: Estimate): Promise<Estimate> {
    const existing = await this.getByLead(estimate.leadId);
    const now = new Date().toISOString();
    if (existing) {
      await db()
        .update(estimates)
        .set({
          status: estimate.status,
          lineItems: estimate.lineItems,
          taxRate: estimate.taxRate,
          discount: estimate.discount,
          depositPercent: estimate.depositPercent,
          notes: estimate.notes,
          validDays: estimate.validDays,
          updatedAt: now,
        })
        .where(eq(estimates.leadId, estimate.leadId));
      return { ...estimate, id: existing.id, createdAt: existing.createdAt, updatedAt: now };
    }
    await db().insert(estimates).values({
      id: estimate.id,
      leadId: estimate.leadId,
      contractorId: estimate.contractorId,
      status: estimate.status,
      lineItems: estimate.lineItems,
      taxRate: estimate.taxRate,
      discount: estimate.discount,
      depositPercent: estimate.depositPercent,
      notes: estimate.notes,
      validDays: estimate.validDays,
      createdAt: estimate.createdAt,
      updatedAt: now,
    });
    return estimate;
  },
};
