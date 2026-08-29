// ---------------------------------------------------------------------------
// Professional Intake — file-based JSON store (local/dev only).
// Same conventions as lib/store-campaign-json.ts.
// ---------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import type { IntakeSession } from "./types.ts";

const DATA_DIR = path.join(process.cwd(), ".data");
const SESSIONS_FILE = path.join(DATA_DIR, "professional-intake-sessions.json");

const ACTIVE_STATUSES = new Set(["not_started", "in_progress", "completed"]);

async function readJson<T>(file: string, seed: T): Promise<T> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    await writeJson(file, seed);
    return seed;
  }
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = file + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, file);
}

export const jsonIntakeSessionStore = {
  /** Operator command-center listing of every intake session, newest-updated first. */
  async listAll(): Promise<IntakeSession[]> {
    const all = await readJson<IntakeSession[]>(SESSIONS_FILE, []);
    return [...all].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async list(ownerType: string, ownerId: string): Promise<IntakeSession[]> {
    const all = await readJson<IntakeSession[]>(SESSIONS_FILE, []);
    return all
      .filter((s) => s.ownerType === ownerType && s.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /** The one non-terminal (not applied/archived) session for this owner, if any — enforces "single active session" like the SnapLink source. */
  async getActive(ownerType: string, ownerId: string): Promise<IntakeSession | undefined> {
    const all = await readJson<IntakeSession[]>(SESSIONS_FILE, []);
    return all.find((s) => s.ownerType === ownerType && s.ownerId === ownerId && ACTIVE_STATUSES.has(s.status));
  },

  async get(id: string): Promise<IntakeSession | undefined> {
    const all = await readJson<IntakeSession[]>(SESSIONS_FILE, []);
    return all.find((s) => s.id === id);
  },

  async create(session: IntakeSession): Promise<IntakeSession> {
    const all = await readJson<IntakeSession[]>(SESSIONS_FILE, []);
    all.push(session);
    await writeJson(SESSIONS_FILE, all);
    return session;
  },

  async update(
    id: string,
    patch: Partial<Pick<IntakeSession, "answers" | "currentStep" | "status" | "flaggedQuestionIds" | "locale" | "submittedAt" | "appliedAt" | "archivedAt" | "contentApprovedAt" | "contentApprovedBy">>
  ): Promise<IntakeSession | undefined> {
    const all = await readJson<IntakeSession[]>(SESSIONS_FILE, []);
    const row = all.find((s) => s.id === id);
    if (!row) return undefined;
    Object.assign(row, patch);
    row.updatedAt = new Date().toISOString();
    await writeJson(SESSIONS_FILE, all);
    return row;
  },
};
