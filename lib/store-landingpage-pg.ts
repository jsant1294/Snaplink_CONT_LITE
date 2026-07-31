// ---------------------------------------------------------------------------
// Contractor landing page — Postgres store. Same shape as lib/store-entitlements-pg.ts.
// ---------------------------------------------------------------------------

import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { contractorLandingPages } from "./db/schema";
import type { ContractorLandingPage, LandingPagePatch } from "./landing-page-types";
import { databaseUrl, sslConfig } from "./db-url";

let _db: NodePgDatabase | null = null;

function db(): NodePgDatabase {
  if (!_db) {
    const pool = new Pool({ connectionString: databaseUrl, ssl: sslConfig, max: 5 });
    _db = drizzle(pool);
  }
  return _db;
}

type Row = typeof contractorLandingPages.$inferSelect;

function rowToLandingPage(row: Row): ContractorLandingPage {
  return {
    id: row.id,
    contractorId: row.contractorId,
    templateKey: row.templateKey ?? undefined,
    published: row.published,
    headlineEn: row.headlineEn ?? undefined,
    headlineEs: row.headlineEs ?? undefined,
    subheadlineEn: row.subheadlineEn ?? undefined,
    subheadlineEs: row.subheadlineEs ?? undefined,
    ctaLabelEn: row.ctaLabelEn ?? undefined,
    ctaLabelEs: row.ctaLabelEs ?? undefined,
    ctaUrl: row.ctaUrl ?? undefined,
    locationText: row.locationText ?? undefined,
    hoursText: row.hoursText ?? undefined,
    noteText: row.noteText ?? undefined,
    heroImageUrl: row.heroImageUrl ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const pgLandingPageStore = {
  async get(contractorId: string): Promise<ContractorLandingPage | undefined> {
    const rows = await db()
      .select()
      .from(contractorLandingPages)
      .where(eq(contractorLandingPages.contractorId, contractorId))
      .limit(1);
    return rows[0] ? rowToLandingPage(rows[0]) : undefined;
  },

  async upsert(id: string, contractorId: string, patch: LandingPagePatch): Promise<ContractorLandingPage> {
    const existing = await this.get(contractorId);
    const now = new Date().toISOString();

    if (!existing) {
      await db()
        .insert(contractorLandingPages)
        .values({
          id,
          contractorId,
          published: patch.published ?? false,
          templateKey: patch.templateKey || null,
          headlineEn: patch.headlineEn || null,
          headlineEs: patch.headlineEs || null,
          subheadlineEn: patch.subheadlineEn || null,
          subheadlineEs: patch.subheadlineEs || null,
          ctaLabelEn: patch.ctaLabelEn || null,
          ctaLabelEs: patch.ctaLabelEs || null,
          ctaUrl: patch.ctaUrl || null,
          locationText: patch.locationText || null,
          hoursText: patch.hoursText || null,
          noteText: patch.noteText || null,
          heroImageUrl: patch.heroImageUrl || null,
          createdAt: now,
          updatedAt: now,
        });
      return (await this.get(contractorId))!;
    }

    const set: Record<string, unknown> = { updatedAt: now };
    if (patch.published !== undefined) set.published = patch.published;
    if (patch.templateKey !== undefined) set.templateKey = patch.templateKey || null;
    if (patch.headlineEn !== undefined) set.headlineEn = patch.headlineEn || null;
    if (patch.headlineEs !== undefined) set.headlineEs = patch.headlineEs || null;
    if (patch.subheadlineEn !== undefined) set.subheadlineEn = patch.subheadlineEn || null;
    if (patch.subheadlineEs !== undefined) set.subheadlineEs = patch.subheadlineEs || null;
    if (patch.ctaLabelEn !== undefined) set.ctaLabelEn = patch.ctaLabelEn || null;
    if (patch.ctaLabelEs !== undefined) set.ctaLabelEs = patch.ctaLabelEs || null;
    if (patch.ctaUrl !== undefined) set.ctaUrl = patch.ctaUrl || null;
    if (patch.locationText !== undefined) set.locationText = patch.locationText || null;
    if (patch.hoursText !== undefined) set.hoursText = patch.hoursText || null;
    if (patch.noteText !== undefined) set.noteText = patch.noteText || null;
    if (patch.heroImageUrl !== undefined) set.heroImageUrl = patch.heroImageUrl || null;

    await db().update(contractorLandingPages).set(set).where(eq(contractorLandingPages.id, existing.id));
    return (await this.get(contractorId))!;
  },
};
