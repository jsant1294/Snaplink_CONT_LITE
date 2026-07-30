import { and, asc, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import {
  realEstateAgents, realEstateAnalyticsEvents, realEstateBrokerages,
  realEstateBuyers, realEstateCalendarConnections, realEstateCampaigns,
  realEstateCommunications, realEstateLeads, realEstateMemberships,
  realEstateOpenHouseAttendees, realEstateOpenHouses, realEstateProperties,
  realEstateReminders, realEstateSellers,
} from "@/lib/db/schema";
import { db } from "./repositories";
import type { DataScope } from "./access";
import { isAgentScope } from "./access";
import type { RealEstateRole } from "./types";

const id = (kind: string) => `re_${kind}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export async function findMembership(tenantId: string, email: string) {
  return (await db().select().from(realEstateMemberships).where(and(
    eq(realEstateMemberships.tenantId, tenantId), eq(realEstateMemberships.userEmail, email.toLowerCase()),
    eq(realEstateMemberships.isActive, true), isNull(realEstateMemberships.deletedAt),
  )).limit(1))[0] ?? null;
}

export async function bootstrapMembership(tenantId: string, email: string, role: RealEstateRole) {
  const existing = await findMembership(tenantId, email);
  if (existing) return existing;
  return (await db().insert(realEstateMemberships).values({
    id: id("member"), tenantId, userEmail: email.toLowerCase(), role,
  }).onConflictDoNothing().returning())[0] ?? findMembership(tenantId, email);
}

export async function listMemberships(scope: DataScope) {
  return db().select().from(realEstateMemberships).where(and(
    eq(realEstateMemberships.tenantId, scope.tenantId), isNull(realEstateMemberships.deletedAt),
  )).orderBy(asc(realEstateMemberships.userEmail));
}

export async function upsertMembership(scope: DataScope, input: { userEmail: string; role: RealEstateRole; agentId?: string | null; isActive?: boolean }) {
  const email = input.userEmail.trim().toLowerCase();
  const agent = input.agentId ? (await db().select({ id: realEstateAgents.id }).from(realEstateAgents).where(and(eq(realEstateAgents.id, input.agentId), eq(realEstateAgents.tenantId, scope.tenantId), isNull(realEstateAgents.deletedAt))).limit(1))[0] : null;
  if (input.agentId && !agent) throw new Error("Agent does not belong to this tenant");
  return (await db().insert(realEstateMemberships).values({
    id: id("member"), tenantId: scope.tenantId, userEmail: email, role: input.role,
    agentId: input.agentId || null, isActive: input.isActive ?? true,
  }).onConflictDoUpdate({
    target: [realEstateMemberships.tenantId, realEstateMemberships.userEmail],
    set: { role: input.role, agentId: input.agentId || null, isActive: input.isActive ?? true, deletedAt: null, updatedAt: new Date().toISOString() },
  }).returning())[0];
}

export async function selectors(scope: DataScope, type: string, query = "") {
  const q = `%${query.trim()}%`;
  if (type === "agents") return db().select({ value: realEstateAgents.id, label: sql<string>`${realEstateAgents.firstName} || ' ' || ${realEstateAgents.lastName}` }).from(realEstateAgents).where(and(eq(realEstateAgents.tenantId, scope.tenantId), isNull(realEstateAgents.deletedAt), eq(realEstateAgents.isActive, true), query ? or(ilike(realEstateAgents.firstName, q), ilike(realEstateAgents.lastName, q), ilike(realEstateAgents.email, q)) : undefined, isAgentScope(scope) ? eq(realEstateAgents.id, scope.agentId) : undefined)).limit(30);
  if (type === "brokerages") return db().select({ value: realEstateBrokerages.id, label: realEstateBrokerages.name }).from(realEstateBrokerages).where(and(eq(realEstateBrokerages.tenantId, scope.tenantId), isNull(realEstateBrokerages.deletedAt), query ? ilike(realEstateBrokerages.name, q) : undefined)).limit(30);
  if (type === "properties") return db().select({ value: realEstateProperties.id, label: realEstateProperties.title }).from(realEstateProperties).where(and(eq(realEstateProperties.tenantId, scope.tenantId), isNull(realEstateProperties.deletedAt), query ? or(ilike(realEstateProperties.title, q), ilike(realEstateProperties.city, q)) : undefined, isAgentScope(scope) ? eq(realEstateProperties.listingAgentId, scope.agentId) : undefined)).limit(30);
  if (type === "buyers") return db().select({ value: realEstateBuyers.id, label: realEstateBuyers.name }).from(realEstateBuyers).where(and(eq(realEstateBuyers.tenantId, scope.tenantId), isNull(realEstateBuyers.deletedAt), query ? ilike(realEstateBuyers.name, q) : undefined, isAgentScope(scope) ? eq(realEstateBuyers.assignedAgentId, scope.agentId) : undefined)).limit(30);
  return [];
}

export async function registerAttendee(openHouseId: string, input: Record<string, unknown>, tenantId?: string) {
  const openHouse = (await db().select().from(realEstateOpenHouses).where(and(eq(realEstateOpenHouses.id, openHouseId), tenantId ? eq(realEstateOpenHouses.tenantId, tenantId) : undefined, eq(realEstateOpenHouses.isPublished, true), isNull(realEstateOpenHouses.deletedAt))).limit(1))[0];
  if (!openHouse) return null;
  const attendee = (await db().insert(realEstateOpenHouseAttendees).values({
    id: id("attendee"), tenantId: openHouse.tenantId, openHouseId,
    name: String(input.name ?? "").trim(), email: String(input.email ?? "").trim(),
    phone: String(input.phone ?? "").trim(), workingWithRealtor: input.workingWithRealtor === true,
    preApproved: input.preApproved === true, budget: String(input.budget ?? ""),
    timeline: String(input.timeline ?? ""), notes: String(input.notes ?? ""), consent: input.consent === true,
  }).returning())[0];
  await db().update(realEstateOpenHouses).set({ attendeeCount: sql`${realEstateOpenHouses.attendeeCount} + 1`, updatedAt: new Date().toISOString() }).where(and(eq(realEstateOpenHouses.id, openHouseId), eq(realEstateOpenHouses.tenantId, openHouse.tenantId)));
  return attendee;
}

export async function listAttendees(scope: DataScope, openHouseId: string) {
  const house = (await db().select().from(realEstateOpenHouses).where(and(eq(realEstateOpenHouses.id, openHouseId), eq(realEstateOpenHouses.tenantId, scope.tenantId), isAgentScope(scope) ? eq(realEstateOpenHouses.assignedAgentId, scope.agentId) : undefined)).limit(1))[0];
  if (!house) return [];
  return db().select().from(realEstateOpenHouseAttendees).where(and(eq(realEstateOpenHouseAttendees.tenantId, scope.tenantId), eq(realEstateOpenHouseAttendees.openHouseId, openHouseId))).orderBy(desc(realEstateOpenHouseAttendees.createdAt));
}

export async function convertLead(scope: DataScope, leadId: string, target: "buyer" | "seller", extra: Record<string, unknown>) {
  const lead = (await db().select().from(realEstateLeads).where(and(eq(realEstateLeads.id, leadId), eq(realEstateLeads.tenantId, scope.tenantId), isNull(realEstateLeads.deletedAt), isAgentScope(scope) ? eq(realEstateLeads.assignedAgentId, scope.agentId) : undefined)).limit(1))[0];
  if (!lead) return null;
  return db().transaction(async (tx) => {
    const created = target === "buyer"
      ? (await tx.insert(realEstateBuyers).values({ id: id("buyer"), tenantId: scope.tenantId, name: lead.name, email: lead.email, phone: lead.phone, assignedAgentId: lead.assignedAgentId, pipelineStage: "active", notes: lead.notes, ...extra } as never).returning())[0]
      : (await tx.insert(realEstateSellers).values({ id: id("seller"), tenantId: scope.tenantId, ownerName: lead.name, email: lead.email, phone: lead.phone, assignedAgentId: lead.assignedAgentId, pipelineStage: "active", propertyAddress: String(extra.propertyAddress ?? "Address pending"), notes: lead.notes, ...extra } as never).returning())[0];
    await tx.update(realEstateLeads).set({ stage: "active", updatedAt: new Date().toISOString() }).where(and(eq(realEstateLeads.id, leadId), eq(realEstateLeads.tenantId, scope.tenantId)));
    return created;
  });
}

export async function listReminders(scope: DataScope) {
  return db().select().from(realEstateReminders).where(and(eq(realEstateReminders.tenantId, scope.tenantId), isNull(realEstateReminders.deletedAt), isAgentScope(scope) ? eq(realEstateReminders.assignedAgentId, scope.agentId) : undefined)).orderBy(asc(realEstateReminders.remindAt));
}
export async function createReminder(scope: DataScope, input: Record<string, unknown>) {
  const assignedAgentId = isAgentScope(scope) ? scope.agentId : String(input.assignedAgentId || "") || null;
  return (await db().insert(realEstateReminders).values({ id: id("reminder"), tenantId: scope.tenantId, assignedAgentId, entityType: String(input.entityType), entityId: String(input.entityId), title: String(input.title), remindAt: String(input.remindAt) }).returning())[0];
}

export async function listCalendarConnections(scope: DataScope, membershipId: string) {
  return db().select().from(realEstateCalendarConnections).where(and(eq(realEstateCalendarConnections.tenantId, scope.tenantId), eq(realEstateCalendarConnections.memberId, membershipId), isNull(realEstateCalendarConnections.deletedAt)));
}
export async function saveCalendarConnection(scope: DataScope, membershipId: string, input: Record<string, unknown>) {
  const provider = String(input.provider);
  return (await db().insert(realEstateCalendarConnections).values({
    id: id("calendar"), tenantId: scope.tenantId, memberId: membershipId, provider,
    externalCalendarId: input.externalCalendarId ? String(input.externalCalendarId) : null,
    syncEnabled: input.syncEnabled === true,
  }).onConflictDoUpdate({ target: [realEstateCalendarConnections.memberId, realEstateCalendarConnections.provider], set: {
    externalCalendarId: input.externalCalendarId ? String(input.externalCalendarId) : null,
    syncEnabled: input.syncEnabled === true, updatedAt: new Date().toISOString(),
  }}).returning())[0];
}

export async function saveCommunication(scope: DataScope, input: Record<string, unknown>) {
  return (await db().insert(realEstateCommunications).values({ id: id("communication"), tenantId: scope.tenantId, entityType: String(input.entityType), entityId: String(input.entityId), channel: String(input.channel), recipient: String(input.recipient), subject: input.subject ? String(input.subject) : null, body: String(input.body), scheduledAt: input.scheduledAt ? String(input.scheduledAt) : null }).returning())[0];
}
export async function listCommunications(scope: DataScope) {
  return db().select().from(realEstateCommunications).where(eq(realEstateCommunications.tenantId, scope.tenantId)).orderBy(desc(realEstateCommunications.createdAt)).limit(100);
}

export async function listCampaigns(scope: DataScope) {
  return db().select().from(realEstateCampaigns).where(and(eq(realEstateCampaigns.tenantId, scope.tenantId), isNull(realEstateCampaigns.deletedAt))).orderBy(desc(realEstateCampaigns.updatedAt));
}
export async function createCampaign(scope: DataScope, input: Record<string, unknown>, membershipId: string) {
  return (await db().insert(realEstateCampaigns).values({ id: id("campaign"), tenantId: scope.tenantId, name: String(input.name), campaignType: String(input.campaignType), status: String(input.status || "draft"), propertyId: input.propertyId ? String(input.propertyId) : null, channels: Array.isArray(input.channels) ? input.channels.map(String) : [], content: typeof input.content === "object" && input.content ? input.content as Record<string, unknown> : {}, startsAt: input.startsAt ? String(input.startsAt) : null, endsAt: input.endsAt ? String(input.endsAt) : null, createdByMembershipId: membershipId }).returning())[0];
}

export async function trackEvent(tenantId: string, input: Record<string, unknown>) {
  return (await db().insert(realEstateAnalyticsEvents).values({ id: id("event"), tenantId, eventName: String(input.eventName), entityType: String(input.entityType), entityId: input.entityId ? String(input.entityId) : null, anonymousId: input.anonymousId ? String(input.anonymousId) : null, source: String(input.source || "app"), metadata: typeof input.metadata === "object" && input.metadata ? input.metadata as Record<string, unknown> : {} }).returning())[0];
}
