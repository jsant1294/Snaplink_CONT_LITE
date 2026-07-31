// ---------------------------------------------------------------------------
// Flipbook — Postgres store. Same shape and conventions as lib/store-pg.ts /
// lib/store-money-pg.ts.
// ---------------------------------------------------------------------------

import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq, asc, desc } from "drizzle-orm";
import { flipCampaigns, flipPages } from "./db/schema";
import { maybeUploadToBlob } from "./store-pg";
import type { FlipCampaign, FlipCampaignStatus, FlipPage } from "./flipbook-types";
import { databaseUrl, sslConfig } from "./db-url";

let _db: NodePgDatabase | null = null;

function db(): NodePgDatabase {
  if (!_db) {
    const pool = new Pool({ connectionString: databaseUrl, ssl: sslConfig, max: 5 });
    _db = drizzle(pool);
  }
  return _db;
}

type CampaignRow = typeof flipCampaigns.$inferSelect;
type PageRow = typeof flipPages.$inferSelect;

function rowToCampaign(row: CampaignRow): FlipCampaign {
  return {
    id: row.id,
    contractorId: row.contractorId,
    slug: row.slug,
    publicToken: row.publicToken,
    title: row.title,
    status: row.status as FlipCampaignStatus,
    shareImageUrl: row.shareImageUrl ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt ?? undefined,
  };
}

function rowToPage(row: PageRow): FlipPage {
  return {
    id: row.id,
    campaignId: row.campaignId,
    sortOrder: row.sortOrder,
    pageType: row.pageType as FlipPage["pageType"],
    headline: row.headline,
    body: row.body,
    mediaUrl: row.mediaUrl ?? undefined,
    ctaType: (row.ctaType as FlipPage["ctaType"]) ?? undefined,
    ctaLabel: row.ctaLabel ?? undefined,
    ctaValue: row.ctaValue ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const pgFlipCampaignStore = {
  async list(contractorId: string): Promise<FlipCampaign[]> {
    const rows = await db()
      .select()
      .from(flipCampaigns)
      .where(eq(flipCampaigns.contractorId, contractorId))
      .orderBy(desc(flipCampaigns.createdAt));
    return rows.map(rowToCampaign);
  },

  async get(id: string): Promise<FlipCampaign | undefined> {
    const rows = await db().select().from(flipCampaigns).where(eq(flipCampaigns.id, id)).limit(1);
    return rows[0] ? rowToCampaign(rows[0]) : undefined;
  },

  async getByToken(token: string): Promise<FlipCampaign | undefined> {
    const rows = await db().select().from(flipCampaigns).where(eq(flipCampaigns.publicToken, token)).limit(1);
    return rows[0] ? rowToCampaign(rows[0]) : undefined;
  },

  async getBySlug(contractorId: string, slug: string): Promise<FlipCampaign | undefined> {
    const rows = await db()
      .select()
      .from(flipCampaigns)
      .where(and(eq(flipCampaigns.contractorId, contractorId), eq(flipCampaigns.slug, slug)))
      .limit(1);
    return rows[0] ? rowToCampaign(rows[0]) : undefined;
  },

  async create(campaign: FlipCampaign): Promise<FlipCampaign> {
    await db().insert(flipCampaigns).values({
      id: campaign.id,
      contractorId: campaign.contractorId,
      slug: campaign.slug,
      publicToken: campaign.publicToken,
      title: campaign.title,
      status: campaign.status,
      shareImageUrl: campaign.shareImageUrl ?? null,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      publishedAt: campaign.publishedAt ?? null,
    });
    return campaign;
  },

  async update(
    id: string,
    patch: Partial<Pick<FlipCampaign, "title" | "slug" | "shareImageUrl">>
  ): Promise<FlipCampaign | undefined> {
    const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (patch.title !== undefined) set.title = patch.title;
    if (patch.slug !== undefined) set.slug = patch.slug;
    if (patch.shareImageUrl !== undefined) set.shareImageUrl = patch.shareImageUrl ?? null;
    await db().update(flipCampaigns).set(set).where(eq(flipCampaigns.id, id));
    return this.get(id);
  },

  async setStatus(
    id: string,
    status: FlipCampaignStatus,
    opts?: { publicToken?: string }
  ): Promise<FlipCampaign | undefined> {
    const existing = await this.get(id);
    if (!existing) return undefined;
    const set: Record<string, unknown> = { status, updatedAt: new Date().toISOString() };
    if (opts?.publicToken && !existing.publicToken) set.publicToken = opts.publicToken;
    if (status === "published" && !existing.publishedAt) set.publishedAt = new Date().toISOString();
    await db().update(flipCampaigns).set(set).where(eq(flipCampaigns.id, id));
    return this.get(id);
  },
};

export const pgFlipPageStore = {
  async listByCampaign(campaignId: string): Promise<FlipPage[]> {
    const rows = await db()
      .select()
      .from(flipPages)
      .where(eq(flipPages.campaignId, campaignId))
      .orderBy(asc(flipPages.sortOrder));
    return rows.map(rowToPage);
  },

  async get(id: string): Promise<FlipPage | undefined> {
    const rows = await db().select().from(flipPages).where(eq(flipPages.id, id)).limit(1);
    return rows[0] ? rowToPage(rows[0]) : undefined;
  },

  async create(page: FlipPage, media?: { dataUrl: string; filename: string }): Promise<FlipPage> {
    let mediaUrl = page.mediaUrl;
    if (media?.dataUrl) {
      mediaUrl = await maybeUploadToBlob(media, `flipbook/${page.campaignId}`);
    }
    await db().insert(flipPages).values({
      id: page.id,
      campaignId: page.campaignId,
      sortOrder: page.sortOrder,
      pageType: page.pageType,
      headline: page.headline,
      body: page.body,
      mediaUrl: mediaUrl ?? null,
      ctaType: page.ctaType ?? null,
      ctaLabel: page.ctaLabel ?? null,
      ctaValue: page.ctaValue ?? null,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    });
    return { ...page, mediaUrl };
  },

  async update(
    id: string,
    patch: Partial<Pick<FlipPage, "pageType" | "headline" | "body" | "mediaUrl" | "ctaType" | "ctaLabel" | "ctaValue">>
  ): Promise<FlipPage | undefined> {
    const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (patch.pageType !== undefined) set.pageType = patch.pageType;
    if (patch.headline !== undefined) set.headline = patch.headline;
    if (patch.body !== undefined) set.body = patch.body;
    if (patch.mediaUrl !== undefined) set.mediaUrl = patch.mediaUrl ?? null;
    if (patch.ctaType !== undefined) set.ctaType = patch.ctaType ?? null;
    if (patch.ctaLabel !== undefined) set.ctaLabel = patch.ctaLabel ?? null;
    if (patch.ctaValue !== undefined) set.ctaValue = patch.ctaValue ?? null;
    await db().update(flipPages).set(set).where(eq(flipPages.id, id));
    return this.get(id);
  },

  async remove(id: string): Promise<boolean> {
    const existing = await this.get(id);
    if (!existing) return false;
    await db().delete(flipPages).where(eq(flipPages.id, id));
    return true;
  },

  async reorder(campaignId: string, orderedIds: string[]): Promise<void> {
    for (let idx = 0; idx < orderedIds.length; idx++) {
      await db()
        .update(flipPages)
        .set({ sortOrder: idx, updatedAt: new Date().toISOString() })
        .where(and(eq(flipPages.id, orderedIds[idx]), eq(flipPages.campaignId, campaignId)));
    }
  },
};
