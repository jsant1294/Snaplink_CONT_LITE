// ---------------------------------------------------------------------------
// Postgres store for Snaplink Profile (self-service real estate agent
// profiles). Same interface shape as lib/store-pg.ts's pgContractorStore —
// API routes never know which backend is live.
// ---------------------------------------------------------------------------

import { eq, desc } from "drizzle-orm";
import { agentProfiles } from "../db/schema";
import { db } from "../db/connection";
import type { AgentOperatorCreateInput, AgentProfile, AgentProfileRequestInput } from "./types";
import { DEFAULT_AGENT_PROFESSION_TYPE } from "../profession-types.ts";

type Row = typeof agentProfiles.$inferSelect;

function rowToProfile(row: Row): AgentProfile {
  return {
    id: row.id,
    slug: row.slug,
    username: row.username ?? undefined,
    status: row.status as AgentProfile["status"],
    pin: row.pin ?? undefined,
    name: row.name,
    firstName: row.firstName,
    lastName: row.lastName,
    displayName: row.displayName,
    professionType: row.professionType ?? DEFAULT_AGENT_PROFESSION_TYPE,
    brokerageName: row.brokerageName,
    officeName: row.officeName,
    teamName: row.teamName,
    licenseNumber: row.licenseNumber,
    licenseState: row.licenseState,
    phone: row.phone,
    email: row.email,
    serviceArea: row.serviceArea,
    bio: row.bio,
    tagline: row.tagline ?? undefined,
    photoUrl: row.photoUrl ?? undefined,
    coverPhotoUrl: row.coverPhotoUrl ?? undefined,
    preferredLanguage: (row.preferredLanguage as AgentProfile["preferredLanguage"]) ?? "en",
    smsPhone: row.smsPhone,
    whatsapp: row.whatsapp,
    website: row.website,
    bookingLink: row.bookingLink,
    facebook: row.facebook,
    instagram: row.instagram,
    linkedin: row.linkedin,
    languages: row.languages,
    specialties: row.specialties,
    serviceAreas: row.serviceAreas,
    categories: row.categories,
    neighborhoods: row.neighborhoods,
    serviceRadius: row.serviceRadius ?? undefined,
    yearsExperience: row.yearsExperience ?? undefined,
    featured: row.featured,
    snaplinkStatus: row.snaplinkStatus as AgentProfile["snaplinkStatus"],
    southlineStatus: row.southlineStatus as AgentProfile["southlineStatus"],
    onboardingStatus: row.onboardingStatus as AgentProfile["onboardingStatus"],
    isDemo: row.isDemo ?? false,
    seoTitle: row.seoTitle ?? undefined,
    seoDescription: row.seoDescription ?? undefined,
    marketplaceSummary: row.marketplaceSummary ?? undefined,
    modules: (row.modules as AgentProfile["modules"]) ?? {},
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
  async getByUsername(username: string): Promise<AgentProfile | undefined> {
    const rows = await db().select().from(agentProfiles).where(eq(agentProfiles.username, username)).limit(1);
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
  /**
   * Operator-driven "New Agent" workflow. One INSERT creates the account,
   * the SnapLink profile, and the Southline listing together (this table is
   * the single source of truth for all three — see
   * docs/architecture/AGENT_MANAGEMENT.md). Caller (the API route) has
   * already validated username/slug/email uniqueness; the DB's unique
   * indexes are the final guard against a race.
   */
  async createAgent(id: string, input: AgentOperatorCreateInput, slug: string): Promise<AgentProfile> {
    const now = new Date().toISOString();
    const name = input.displayName?.trim() || `${input.firstName} ${input.lastName}`.trim();
    const rows = await db().insert(agentProfiles).values({
      id,
      slug,
      username: input.username,
      status: input.status ?? "active",
      pin: input.pin,
      name,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      displayName: input.displayName?.trim() || name,
      professionType: input.professionType ?? DEFAULT_AGENT_PROFESSION_TYPE,
      brokerageName: input.brokerageName?.trim() || "",
      officeName: input.officeName?.trim() || "",
      teamName: input.teamName?.trim() || "",
      licenseNumber: input.licenseNumber?.trim() || "",
      licenseState: input.licenseState?.trim() || "",
      phone: input.phone.trim(),
      email: input.email.trim().toLowerCase(),
      serviceArea: input.serviceArea?.trim() || "",
      bio: input.bio?.trim() || "",
      tagline: input.tagline?.trim(),
      photoUrl: input.photoUrl,
      coverPhotoUrl: input.coverPhotoUrl,
      preferredLanguage: input.preferredLanguage ?? "en",
      smsPhone: input.smsPhone?.trim() || "",
      whatsapp: input.whatsapp?.trim() || "",
      website: input.website?.trim() || "",
      bookingLink: input.bookingLink?.trim() || "",
      facebook: input.facebook?.trim() || "",
      instagram: input.instagram?.trim() || "",
      linkedin: input.linkedin?.trim() || "",
      languages: input.languages ?? [],
      specialties: input.specialties ?? [],
      serviceAreas: input.serviceAreas ?? [],
      categories: input.categories ?? [],
      neighborhoods: input.neighborhoods ?? [],
      serviceRadius: input.serviceRadius,
      yearsExperience: input.yearsExperience,
      featured: input.featured ?? false,
      snaplinkStatus: input.snaplinkStatus ?? "draft",
      southlineStatus: input.southlineStatus ?? "draft",
      onboardingStatus: "invited",
      isDemo: input.isDemo ?? false,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      marketplaceSummary: input.marketplaceSummary,
      modules: input.modules ?? {},
      tier: input.tier,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return rowToProfile(rows[0]);
  },
  async update(id: string, patch: Partial<Omit<AgentProfile, "id" | "createdAt">>): Promise<AgentProfile | undefined> {
    const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const [key, value] of Object.entries(patch)) if (value !== undefined) set[key] = value;
    if (Object.keys(set).length > 1) await db().update(agentProfiles).set(set).where(eq(agentProfiles.id, id));
    return this.getById(id);
  },

  /** Operator-only manual payment/comp override — see lib/professional-intake-payment/. A dedicated method (not update()) so clearing the status is unambiguous — update() skips `undefined` values, so it cannot express "clear this column." */
  async setManualPayment(
    id: string,
    patch: { manualPaymentStatus: string | null; manualPaymentNote?: string; manualPaymentSetBy: string }
  ): Promise<AgentProfile | undefined> {
    await db()
      .update(agentProfiles)
      .set({
        manualPaymentStatus: patch.manualPaymentStatus,
        manualPaymentNote: patch.manualPaymentNote ?? null,
        manualPaymentSetAt: new Date().toISOString(),
        manualPaymentSetBy: patch.manualPaymentSetBy,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(agentProfiles.id, id));
    return this.getById(id);
  },
};

