// ---------------------------------------------------------------------------
// Module entitlements — file-based JSON store (local/dev only).
// Same conventions as lib/store-campaign-json.ts.
// ---------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import type { ModuleEntitlement, ModuleKey, ProfessionalSource } from "./entitlement-types";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "module-entitlements.json");

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

export const jsonEntitlementStore = {
  async listForProfessional(
    professionalId: string,
    professionalSource: ProfessionalSource = "contractor"
  ): Promise<ModuleEntitlement[]> {
    const all = await readJson<ModuleEntitlement[]>(FILE, []);
    return all.filter(
      (e) => e.professionalId === professionalId && e.professionalSource === professionalSource
    );
  },

  async get(
    professionalId: string,
    moduleKey: ModuleKey,
    professionalSource: ProfessionalSource = "contractor"
  ): Promise<ModuleEntitlement | undefined> {
    const all = await readJson<ModuleEntitlement[]>(FILE, []);
    return all.find(
      (e) =>
        e.professionalId === professionalId &&
        e.professionalSource === professionalSource &&
        e.moduleKey === moduleKey
    );
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
    const all = await readJson<ModuleEntitlement[]>(FILE, []);
    const source = params.professionalSource ?? "contractor";
    const now = new Date().toISOString();
    let row = all.find(
      (e) =>
        e.professionalId === params.professionalId &&
        e.professionalSource === source &&
        e.moduleKey === params.moduleKey
    );
    if (!row) {
      row = {
        id: params.id,
        professionalSource: source,
        professionalId: params.professionalId,
        moduleKey: params.moduleKey,
        enabled: params.enabled,
        createdAt: now,
        updatedAt: now,
      };
      all.push(row);
    }
    row.enabled = params.enabled;
    row.enabledBy = params.enabledBy;
    if (params.notes !== undefined) row.notes = params.notes;
    if (params.enabled) {
      row.enabledAt = now;
      row.disabledAt = undefined;
    } else {
      row.disabledAt = now;
    }
    row.updatedAt = now;
    await writeJson(FILE, all);
    return row;
  },
};
