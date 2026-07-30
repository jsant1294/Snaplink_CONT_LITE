import { and, desc, eq, isNull, sql } from "drizzle-orm";
import {
  realEstateActivities,
  realEstateAgents,
  realEstateBrokerages,
  realEstateBuyers,
  realEstateLeads,
  realEstateOpenHouses,
  realEstateProperties,
  realEstateSellers,
  realEstateShowings,
  realEstateTasks,
} from "@/lib/db/schema";
import { db } from "./repositories";

export type CrmResource =
  | "brokerages" | "agents" | "buyers" | "sellers"
  | "leads" | "showings" | "open-houses" | "tasks";

type RecordValue = string | number | boolean | string[] | Record<string, string> | null;
export type CrmRecord = Record<string, RecordValue>;

const tables = {
  brokerages: realEstateBrokerages,
  agents: realEstateAgents,
  buyers: realEstateBuyers,
  sellers: realEstateSellers,
  leads: realEstateLeads,
  showings: realEstateShowings,
  "open-houses": realEstateOpenHouses,
  tasks: realEstateTasks,
};

function newId(resource: string) {
  return `re_${resource.replace("-", "_")}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export async function recordActivity(
  tenantId: string,
  entityType: string,
  entityId: string,
  action: string,
  description: string,
  metadata: Record<string, unknown> = {}
) {
  await db().insert(realEstateActivities).values({
    id: newId("activity"), tenantId, entityType, entityId, action, description, metadata,
  });
}

export const crmRepository = {
  async list(resource: CrmResource, tenantId: string): Promise<CrmRecord[]> {
    const table = tables[resource];
    const rows = await db().select().from(table).where(and(eq(table.tenantId, tenantId), isNull(table.deletedAt))).orderBy(desc(table.updatedAt));
    return rows as unknown as CrmRecord[];
  },

  async find(resource: CrmResource, id: string, tenantId: string): Promise<CrmRecord | null> {
    const table = tables[resource];
    const rows = await db().select().from(table).where(and(eq(table.id, id), eq(table.tenantId, tenantId), isNull(table.deletedAt))).limit(1);
    return (rows[0] as unknown as CrmRecord) ?? null;
  },

  async create(resource: CrmResource, tenantId: string, input: CrmRecord): Promise<CrmRecord> {
    const table = tables[resource];
    const id = newId(resource);
    const rows = await db().insert(table).values({ ...input, id, tenantId } as never).returning();
    const action = resource === "showings" ? "scheduled" : "created";
    const description = resource === "showings" ? "Showing scheduled" : `${resource.replace("-", " ")} created`;
    await recordActivity(tenantId, resource, id, action, description);
    return rows[0] as unknown as CrmRecord;
  },

  async update(resource: CrmResource, id: string, tenantId: string, input: CrmRecord): Promise<CrmRecord | null> {
    const table = tables[resource];
    const rows = await db().update(table).set({ ...input, updatedAt: new Date().toISOString() } as never).where(and(eq(table.id, id), eq(table.tenantId, tenantId), isNull(table.deletedAt))).returning();
    if (rows[0]) {
      const action = resource === "leads" && input.assignedAgentId ? "assigned" : "updated";
      await recordActivity(tenantId, resource, id, action, action === "assigned" ? "Lead assigned" : `${resource.replace("-", " ")} updated`);
    }
    return (rows[0] as unknown as CrmRecord) ?? null;
  },

  async archive(resource: CrmResource, id: string, tenantId: string): Promise<boolean> {
    const table = tables[resource];
    const patch = resource === "brokerages" ? { isArchived: true } : resource === "agents" ? { isActive: false } : { status: "archived" };
    const rows = await db().update(table).set({ ...patch, updatedAt: new Date().toISOString() } as never).where(and(eq(table.id, id), eq(table.tenantId, tenantId), isNull(table.deletedAt))).returning({ id: table.id });
    if (rows[0]) await recordActivity(tenantId, resource, id, "archived", `${resource.replace("-", " ")} archived`);
    return Boolean(rows[0]);
  },

  async softDelete(resource: CrmResource, id: string, tenantId: string): Promise<boolean> {
    const table = tables[resource];
    const rows = await db().update(table).set({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as never).where(and(eq(table.id, id), eq(table.tenantId, tenantId), isNull(table.deletedAt))).returning({ id: table.id });
    if (rows[0]) await recordActivity(tenantId, resource, id, "deleted", `${resource.replace("-", " ")} deleted`);
    return Boolean(rows[0]);
  },

  async activities(tenantId: string, limit = 20) {
    return db().select().from(realEstateActivities).where(eq(realEstateActivities.tenantId, tenantId)).orderBy(desc(realEstateActivities.createdAt)).limit(limit);
  },

  async metrics(tenantId: string) {
    const count = async (table: typeof realEstateProperties, condition?: ReturnType<typeof eq>) => {
      const filters = [eq(table.tenantId, tenantId), isNull(table.deletedAt), ...(condition ? [condition] : [])];
      return (await db().select({ count: sql<number>`count(*)::int` }).from(table).where(and(...filters)))[0]?.count ?? 0;
    };
    const [activeListings, pendingListings, soldListings, buyers, sellers, showings, openHouses, leads, tasks] = await Promise.all([
      count(realEstateProperties, eq(realEstateProperties.propertyStatus, "active")),
      count(realEstateProperties, eq(realEstateProperties.propertyStatus, "pending")),
      count(realEstateProperties, eq(realEstateProperties.propertyStatus, "sold")),
      db().select({ count: sql<number>`count(*)::int` }).from(realEstateBuyers).where(and(eq(realEstateBuyers.tenantId, tenantId), isNull(realEstateBuyers.deletedAt))).then((r) => r[0]?.count ?? 0),
      db().select({ count: sql<number>`count(*)::int` }).from(realEstateSellers).where(and(eq(realEstateSellers.tenantId, tenantId), isNull(realEstateSellers.deletedAt))).then((r) => r[0]?.count ?? 0),
      db().select({ count: sql<number>`count(*)::int` }).from(realEstateShowings).where(and(eq(realEstateShowings.tenantId, tenantId), isNull(realEstateShowings.deletedAt))).then((r) => r[0]?.count ?? 0),
      db().select({ count: sql<number>`count(*)::int` }).from(realEstateOpenHouses).where(and(eq(realEstateOpenHouses.tenantId, tenantId), isNull(realEstateOpenHouses.deletedAt))).then((r) => r[0]?.count ?? 0),
      db().select({ stage: realEstateLeads.stage, count: sql<number>`count(*)::int` }).from(realEstateLeads).where(and(eq(realEstateLeads.tenantId, tenantId), isNull(realEstateLeads.deletedAt))).groupBy(realEstateLeads.stage),
      db().select().from(realEstateTasks).where(and(eq(realEstateTasks.tenantId, tenantId), eq(realEstateTasks.status, "open"), isNull(realEstateTasks.deletedAt))).orderBy(realEstateTasks.dueAt).limit(8),
    ]);
    return { activeListings, pendingListings, soldListings, buyers, sellers, showings, openHouses, leads, tasks };
  },
};
