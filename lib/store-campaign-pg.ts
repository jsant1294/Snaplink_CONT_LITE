// ---------------------------------------------------------------------------
// Mini Campaign — Postgres store. Same shape and conventions as
// lib/store-flipbook-pg.ts.
// ---------------------------------------------------------------------------

import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq, desc } from "drizzle-orm";
import { campaigns } from "./db/schema";
import type { Campaign, CampaignStatus } from "./campaign-types";
import { databaseUrl, sslConfig } from "./db-url";

let _db: NodePgDatabase | null = null;

function db(): NodePgDatabase {
  if (!_db) {
    const pool = new Pool({ connectionString: databaseUrl, ssl: sslConfig, max: 5 });
    _db = drizzle(pool);
  }
  return _db;
}

type CampaignRow = typeof campaigns.$inferSelect;

function rowToCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    contractorId: row.contractorId,
    slug: row.slug,
    status: row.status as CampaignStatus,
    titleEn: row.titleEn,
    titleEs: row.titleEs,
    bodyEn: row.bodyEn,
    bodyEs: row.bodyEs,
    mediaUrl: row.mediaUrl ?? undefined,
    ctaType: row.ctaType as Campaign["ctaType"],
    ctaValue: row.ctaValue,
    startsAt: row.startsAt ?? undefined,
    endsAt: row.endsAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const pgCampaignStore = {
  async list(contractorId: string): Promise<Campaign[]> {
    const rows = await db()
      .select()
      .from(campaigns)
      .where(eq(campaigns.contractorId, contractorId))
      .orderBy(desc(campaigns.createdAt));
    return rows.map(rowToCampaign);
  },

  async get(id: string): Promise<Campaign | undefined> {
    const rows = await db().select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return rows[0] ? rowToCampaign(rows[0]) : undefined;
  },

  async getBySlug(contractorId: string, slug: string): Promise<Campaign | undefined> {
    const rows = await db()
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.contractorId, contractorId), eq(campaigns.slug, slug)))
      .limit(1);
    return rows[0] ? rowToCampaign(rows[0]) : undefined;
  },

  async create(campaign: Campaign): Promise<Campaign> {
    await db().insert(campaigns).values({
      id: campaign.id,
      contractorId: campaign.contractorId,
      slug: campaign.slug,
      status: campaign.status,
      titleEn: campaign.titleEn,
      titleEs: campaign.titleEs,
      bodyEn: campaign.bodyEn,
      bodyEs: campaign.bodyEs,
      mediaUrl: campaign.mediaUrl ?? null,
      ctaType: campaign.ctaType,
      ctaValue: campaign.ctaValue,
      startsAt: campaign.startsAt ?? null,
      endsAt: campaign.endsAt ?? null,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    });
    return campaign;
  },

  async update(
    id: string,
    patch: Partial<Pick<Campaign, "titleEn" | "titleEs" | "bodyEn" | "bodyEs" | "mediaUrl" | "ctaType" | "ctaValue" | "startsAt" | "endsAt">>
  ): Promise<Campaign | undefined> {
    const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (patch.titleEn !== undefined) set.titleEn = patch.titleEn;
    if (patch.titleEs !== undefined) set.titleEs = patch.titleEs;
    if (patch.bodyEn !== undefined) set.bodyEn = patch.bodyEn;
    if (patch.bodyEs !== undefined) set.bodyEs = patch.bodyEs;
    if (patch.mediaUrl !== undefined) set.mediaUrl = patch.mediaUrl ?? null;
    if (patch.ctaType !== undefined) set.ctaType = patch.ctaType;
    if (patch.ctaValue !== undefined) set.ctaValue = patch.ctaValue;
    if (patch.startsAt !== undefined) set.startsAt = patch.startsAt ?? null;
    if (patch.endsAt !== undefined) set.endsAt = patch.endsAt ?? null;
    await db().update(campaigns).set(set).where(eq(campaigns.id, id));
    return this.get(id);
  },

  async setStatus(id: string, status: CampaignStatus): Promise<Campaign | undefined> {
    await db()
      .update(campaigns)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(campaigns.id, id));
    return this.get(id);
  },
};
