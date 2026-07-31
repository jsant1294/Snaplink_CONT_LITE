// ---------------------------------------------------------------------------
// Module entitlements — Postgres store. Same shape as lib/store-campaign-pg.ts.
// ---------------------------------------------------------------------------

import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq } from "drizzle-orm";
import { professionalModuleEntitlements } from "./db/schema";
import type { ModuleEntitlement, ModuleKey, ProfessionalSource } from "./entitlement-types";
import { databaseUrl, sslConfig } from "./db-url";

let _db: NodePgDatabase | null = null;

function db(): NodePgDatabase {
  if (!_db) {
    const pool = new Pool({ connectionString: databaseUrl, ssl: sslConfig, max: 5 });
    _db = drizzle(pool);
  }
  return _db;
}

type Row = typeof professionalModuleEntitlements.$inferSelect;

function rowToEntitlement(row: Row): ModuleEntitlement {
  return {
    id: row.id,
    professionalSource: row.professionalSource as ProfessionalSource,
    professionalId: row.professionalId,
    moduleKey: row.moduleKey as ModuleKey,
    enabled: row.enabled,
    enabledBy: row.enabledBy ?? undefined,
    enabledAt: row.enabledAt ?? undefined,
    disabledAt: row.disabledAt ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const pgEntitlementStore = {
  async listForProfessional(
    professionalId: string,
    professionalSource: ProfessionalSource = "contractor"
  ): Promise<ModuleEntitlement[]> {
    const rows = await db()
      .select()
      .from(professionalModuleEntitlements)
      .where(
        and(
          eq(professionalModuleEntitlements.professionalId, professionalId),
          eq(professionalModuleEntitlements.professionalSource, professionalSource)
        )
      );
    return rows.map(rowToEntitlement);
  },

  async get(
    professionalId: string,
    moduleKey: ModuleKey,
    professionalSource: ProfessionalSource = "contractor"
  ): Promise<ModuleEntitlement | undefined> {
    const rows = await db()
      .select()
      .from(professionalModuleEntitlements)
      .where(
        and(
          eq(professionalModuleEntitlements.professionalId, professionalId),
          eq(professionalModuleEntitlements.professionalSource, professionalSource),
          eq(professionalModuleEntitlements.moduleKey, moduleKey)
        )
      )
      .limit(1);
    return rows[0] ? rowToEntitlement(rows[0]) : undefined;
  },

  async setEnabled(params: {
    id: string;
    professionalId: string;
    professionalSource?: ProfessionalSource;
    moduleKey: ModuleKey;
    enabled: boolean;
    enabledBy: string;
    notes?: string;
  }): Promise<ModuleEntitlement> {
    const source = params.professionalSource ?? "contractor";
    const existing = await this.get(params.professionalId, params.moduleKey, source);
    const now = new Date().toISOString();

    if (!existing) {
      await db().insert(professionalModuleEntitlements).values({
        id: params.id,
        professionalSource: source,
        professionalId: params.professionalId,
        moduleKey: params.moduleKey,
        enabled: params.enabled,
        enabledBy: params.enabledBy,
        enabledAt: params.enabled ? now : null,
        disabledAt: params.enabled ? null : now,
        notes: params.notes ?? null,
        createdAt: now,
        updatedAt: now,
      });
      return (await this.get(params.professionalId, params.moduleKey, source))!;
    }

    const set: Record<string, unknown> = {
      enabled: params.enabled,
      enabledBy: params.enabledBy,
      updatedAt: now,
    };
    if (params.notes !== undefined) set.notes = params.notes;
    if (params.enabled) {
      set.enabledAt = now;
      set.disabledAt = null;
    } else {
      set.disabledAt = now;
    }
    await db().update(professionalModuleEntitlements).set(set).where(eq(professionalModuleEntitlements.id, existing.id));
    return (await this.get(params.professionalId, params.moduleKey, source))!;
  },
};
