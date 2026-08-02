// ---------------------------------------------------------------------------
// Professional Intake — Postgres store. Same shape and conventions as
// lib/store-campaign-pg.ts.
// ---------------------------------------------------------------------------

import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq, desc, inArray } from "drizzle-orm";
import { professionalIntakeSessions } from "../db/schema.ts";
import type { IntakeSession, IntakeSessionStatus } from "./types.ts";
import { databaseUrl, sslConfig } from "../db-url.ts";

let _db: NodePgDatabase | null = null;

function db(): NodePgDatabase {
  if (!_db) {
    const pool = new Pool({ connectionString: databaseUrl, ssl: sslConfig, max: 5 });
    _db = drizzle(pool);
  }
  return _db;
}

const ACTIVE_STATUSES: IntakeSessionStatus[] = ["not_started", "in_progress", "completed"];

type SessionRow = typeof professionalIntakeSessions.$inferSelect;

function rowToSession(row: SessionRow): IntakeSession {
  return {
    id: row.id,
    ownerType: row.ownerType as IntakeSession["ownerType"],
    ownerId: row.ownerId,
    status: row.status as IntakeSessionStatus,
    locale: row.locale as IntakeSession["locale"],
    currentStep: row.currentStep,
    answers: row.answers,
    flaggedQuestionIds: row.flaggedQuestionIds,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    submittedAt: row.submittedAt ?? undefined,
    appliedAt: row.appliedAt ?? undefined,
    archivedAt: row.archivedAt ?? undefined,
  };
}

export const pgIntakeSessionStore = {
  async list(ownerType: string, ownerId: string): Promise<IntakeSession[]> {
    const rows = await db()
      .select()
      .from(professionalIntakeSessions)
      .where(and(eq(professionalIntakeSessions.ownerType, ownerType), eq(professionalIntakeSessions.ownerId, ownerId)))
      .orderBy(desc(professionalIntakeSessions.createdAt));
    return rows.map(rowToSession);
  },

  async getActive(ownerType: string, ownerId: string): Promise<IntakeSession | undefined> {
    const rows = await db()
      .select()
      .from(professionalIntakeSessions)
      .where(
        and(
          eq(professionalIntakeSessions.ownerType, ownerType),
          eq(professionalIntakeSessions.ownerId, ownerId),
          inArray(professionalIntakeSessions.status, ACTIVE_STATUSES)
        )
      )
      .limit(1);
    return rows[0] ? rowToSession(rows[0]) : undefined;
  },

  async get(id: string): Promise<IntakeSession | undefined> {
    const rows = await db().select().from(professionalIntakeSessions).where(eq(professionalIntakeSessions.id, id)).limit(1);
    return rows[0] ? rowToSession(rows[0]) : undefined;
  },

  async create(session: IntakeSession): Promise<IntakeSession> {
    await db().insert(professionalIntakeSessions).values({
      id: session.id,
      ownerType: session.ownerType,
      ownerId: session.ownerId,
      status: session.status,
      locale: session.locale,
      currentStep: session.currentStep,
      answers: session.answers,
      flaggedQuestionIds: session.flaggedQuestionIds,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      submittedAt: session.submittedAt ?? null,
      appliedAt: session.appliedAt ?? null,
      archivedAt: session.archivedAt ?? null,
    });
    return session;
  },

  async update(
    id: string,
    patch: Partial<
      Pick<IntakeSession, "answers" | "currentStep" | "status" | "flaggedQuestionIds" | "locale" | "submittedAt" | "appliedAt" | "archivedAt">
    >
  ): Promise<IntakeSession | undefined> {
    const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (patch.answers !== undefined) set.answers = patch.answers;
    if (patch.currentStep !== undefined) set.currentStep = patch.currentStep;
    if (patch.status !== undefined) set.status = patch.status;
    if (patch.flaggedQuestionIds !== undefined) set.flaggedQuestionIds = patch.flaggedQuestionIds;
    if (patch.locale !== undefined) set.locale = patch.locale;
    if (patch.submittedAt !== undefined) set.submittedAt = patch.submittedAt ?? null;
    if (patch.appliedAt !== undefined) set.appliedAt = patch.appliedAt ?? null;
    if (patch.archivedAt !== undefined) set.archivedAt = patch.archivedAt ?? null;
    await db().update(professionalIntakeSessions).set(set).where(eq(professionalIntakeSessions.id, id));
    return this.get(id);
  },
};
