// ---------------------------------------------------------------------------
// Mini Campaign — file-based JSON store (local/dev only).
// Same conventions as lib/store-flipbook-json.ts.
// ---------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import type { Campaign, CampaignStatus } from "./campaign-types";

const DATA_DIR = path.join(process.cwd(), ".data");
const CAMPAIGNS_FILE = path.join(DATA_DIR, "mini-campaigns.json");

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

export const jsonCampaignStore = {
  async list(contractorId: string): Promise<Campaign[]> {
    const all = await readJson<Campaign[]>(CAMPAIGNS_FILE, []);
    return all
      .filter((c) => c.contractorId === contractorId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async get(id: string): Promise<Campaign | undefined> {
    const all = await readJson<Campaign[]>(CAMPAIGNS_FILE, []);
    return all.find((c) => c.id === id);
  },

  async getBySlug(contractorId: string, slug: string): Promise<Campaign | undefined> {
    const all = await readJson<Campaign[]>(CAMPAIGNS_FILE, []);
    return all.find((c) => c.contractorId === contractorId && c.slug === slug);
  },

  async create(campaign: Campaign): Promise<Campaign> {
    const all = await readJson<Campaign[]>(CAMPAIGNS_FILE, []);
    all.push(campaign);
    await writeJson(CAMPAIGNS_FILE, all);
    return campaign;
  },

  async update(
    id: string,
    patch: Partial<Pick<Campaign, "titleEn" | "titleEs" | "bodyEn" | "bodyEs" | "mediaUrl" | "ctaType" | "ctaValue" | "startsAt" | "endsAt">>
  ): Promise<Campaign | undefined> {
    const all = await readJson<Campaign[]>(CAMPAIGNS_FILE, []);
    const row = all.find((c) => c.id === id);
    if (!row) return undefined;
    Object.assign(row, patch);
    row.updatedAt = new Date().toISOString();
    await writeJson(CAMPAIGNS_FILE, all);
    return row;
  },

  async setStatus(id: string, status: CampaignStatus): Promise<Campaign | undefined> {
    const all = await readJson<Campaign[]>(CAMPAIGNS_FILE, []);
    const row = all.find((c) => c.id === id);
    if (!row) return undefined;
    row.status = status;
    row.updatedAt = new Date().toISOString();
    await writeJson(CAMPAIGNS_FILE, all);
    return row;
  },
};
