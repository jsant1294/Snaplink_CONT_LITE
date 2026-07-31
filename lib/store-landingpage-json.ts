// ---------------------------------------------------------------------------
// Contractor landing page — file-based JSON store (local/dev only).
// Same conventions as lib/store-entitlements-json.ts.
// ---------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import type { ContractorLandingPage, LandingPagePatch } from "./landing-page-types";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "landing-pages.json");

async function readAll(): Promise<ContractorLandingPage[]> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as ContractorLandingPage[];
  } catch {
    await writeAll([]);
    return [];
  }
}

async function writeAll(list: ContractorLandingPage[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf-8");
  await fs.rename(tmp, FILE);
}

export const jsonLandingPageStore = {
  async get(contractorId: string): Promise<ContractorLandingPage | undefined> {
    const all = await readAll();
    return all.find((p) => p.contractorId === contractorId);
  },

  async upsert(id: string, contractorId: string, patch: LandingPagePatch): Promise<ContractorLandingPage> {
    const all = await readAll();
    const now = new Date().toISOString();
    let row = all.find((p) => p.contractorId === contractorId);
    if (!row) {
      row = { id, contractorId, published: false, createdAt: now, updatedAt: now };
      all.push(row);
    }
    Object.assign(row, patch);
    row.updatedAt = now;
    await writeAll(all);
    return row;
  },
};
