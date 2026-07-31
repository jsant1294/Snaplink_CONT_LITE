// ---------------------------------------------------------------------------
// Postgres store for Snaplink Profile (self-service real estate agent
// profiles). Same interface shape as lib/store-pg.ts's pgContractorStore —
// API routes never know which backend is live.
// ---------------------------------------------------------------------------

import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, desc } from "drizzle-orm";
import { agentProfiles } from "../db/schema";
import { databaseUrl, sslConfig } from "../db-url";
import type { AgentProfile, AgentProfileRequestInput } from "./types";

let _db: NodePgDatabase | null = null;

function db(): NodePgDatabase {
  if (!_db) {
    _db = drizzle(new Pool({ connectionString: databaseUrl, ssl: sslConfig, max: 5 }));
  }
  return _db;
}

type Row = typeof agentProfiles.$inferSelect;

function rowToProfile(row: Row): AgentProfile {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status as AgentProfile["status"],
    pin: row.pin ?? undefined,
    name: row.name,
    brokerageName: row.brokerageName,
    licenseNumber: row.licenseNumber,
    phone: row.phone,
    email: row.email,
    serviceArea: row.serviceArea,
    bio: row.bio,
    tagline: row.tagline ?? undefined,
    photoUrl: row.photoUrl ?? undefined,
    languages: row.languages,
    specialties: row.specialties,
    serviceAreas: row.serviceAreas,
    yearsExperience: row.yearsExperience ?? undefined,
    tier: (row.tier as AgentProfile["tier"]) ?? undefined,
    billingTenantId: row.billingTenantId ?? undefined,
    billingOrganizationId: row.billingOrganizationId ?? undefined,
    billingSubscriptionId: row.billingSubscriptionId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const pgAgentProfileStore = {
  async list(): Promise<AgentProfile[]> {
    const rows = await db().select().from(agentProfiles).orderBy(desc(agentProfiles.createdAt));
    return rows.map(rowToProfile);
  },
  async listActive(): Promise<AgentProfile[]> {
    const rows = await db().select().from(agentProfiles).where(eq(agentProfiles.status, "active")).orderBy(desc(agentProfiles.createdAt));
    return rows.map(rowToProfile);
  },
  async listPending(): Promise<AgentProfile[]> {
    const rows = await db().select().from(agentProfiles).where(eq(agentProfiles.status, "pending")).orderBy(agentProfiles.createdAt);
    return rows.map(rowToProfile);
  },
  async getBySlug(slug: string): Promise<AgentProfile | undefined> {
    const rows = await db().select().from(agentProfiles).where(eq(agentProfiles.slug, slug)).limit(1);
    return rows[0] ? rowToProfile(rows[0]) : undefined;
  },
  async getById(id: string): Promise<AgentProfile | undefined> {
    const rows = await db().select().from(agentProfiles).where(eq(agentProfiles.id, id)).limit(1);
    return rows[0] ? rowToProfile(rows[0]) : undefined;
  },
  async create(id: string, input: AgentProfileRequestInput): Promise<AgentProfile> {
    let slug = slugify(input.name) || id;
    if (await this.getBySlug(slug)) slug = `${slug}-${id.slice(-6)}`;
    const now = new Date().toISOString();
    const rows = await db().insert(agentProfiles).values({
      id,
      slug,
      status: "pending",
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      serviceArea: input.serviceArea.trim(),
      brokerageName: input.brokerageName?.trim() || "",
      licenseNumber: input.licenseNumber?.trim() || "",
      bio: input.bio?.trim() || "",
      tagline: input.tagline?.trim(),
      photoUrl: input.photoUrl,
      languages: input.languages ?? [],
      specialties: input.specialties ?? [],
      serviceAreas: input.serviceAreas ?? [],
      yearsExperience: input.yearsExperience,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return rowToProfile(rows[0]);
  },
  async update(id: string, patch: Partial<Omit<AgentProfile, "id" | "slug" | "createdAt">>): Promise<AgentProfile | undefined> {
    const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const [key, value] of Object.entries(patch)) if (value !== undefined) set[key] = value;
    if (Object.keys(set).length > 1) await db().update(agentProfiles).set(set).where(eq(agentProfiles.id, id));
    return this.getById(id);
  },
};
