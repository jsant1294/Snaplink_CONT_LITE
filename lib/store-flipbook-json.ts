// ---------------------------------------------------------------------------
// Flipbook — file-based JSON store (local/dev only).
// Same conventions as lib/store-money-json.ts: atomic temp-file writes.
// Never use this mode on serverless (ephemeral filesystem = data loss).
// ---------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import type { FlipCampaign, FlipCampaignStatus, FlipPage } from "./flipbook-types";

const DATA_DIR = path.join(process.cwd(), ".data");
const CAMPAIGNS_FILE = path.join(DATA_DIR, "flip-campaigns.json");
const PAGES_FILE = path.join(DATA_DIR, "flip-pages.json");

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

export const jsonFlipCampaignStore = {
  async list(contractorId: string): Promise<FlipCampaign[]> {
    const all = await readJson<FlipCampaign[]>(CAMPAIGNS_FILE, []);
    return all
      .filter((c) => c.contractorId === contractorId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async get(id: string): Promise<FlipCampaign | undefined> {
    const all = await readJson<FlipCampaign[]>(CAMPAIGNS_FILE, []);
    return all.find((c) => c.id === id);
  },

  async getByToken(token: string): Promise<FlipCampaign | undefined> {
    const all = await readJson<FlipCampaign[]>(CAMPAIGNS_FILE, []);
    return all.find((c) => c.publicToken === token);
  },

  async getBySlug(contractorId: string, slug: string): Promise<FlipCampaign | undefined> {
    const all = await readJson<FlipCampaign[]>(CAMPAIGNS_FILE, []);
    return all.find((c) => c.contractorId === contractorId && c.slug === slug);
  },

  async create(campaign: FlipCampaign): Promise<FlipCampaign> {
    const all = await readJson<FlipCampaign[]>(CAMPAIGNS_FILE, []);
    all.push(campaign);
    await writeJson(CAMPAIGNS_FILE, all);
    return campaign;
  },

  async update(
    id: string,
    patch: Partial<Pick<FlipCampaign, "title" | "slug" | "shareImageUrl">>
  ): Promise<FlipCampaign | undefined> {
    const all = await readJson<FlipCampaign[]>(CAMPAIGNS_FILE, []);
    const row = all.find((c) => c.id === id);
    if (!row) return undefined;
    Object.assign(row, patch);
    row.updatedAt = new Date().toISOString();
    await writeJson(CAMPAIGNS_FILE, all);
    return row;
  },

  async setStatus(
    id: string,
    status: FlipCampaignStatus,
    opts?: { publicToken?: string }
  ): Promise<FlipCampaign | undefined> {
    const all = await readJson<FlipCampaign[]>(CAMPAIGNS_FILE, []);
    const row = all.find((c) => c.id === id);
    if (!row) return undefined;
    row.status = status;
    if (opts?.publicToken && !row.publicToken) row.publicToken = opts.publicToken;
    if (status === "published" && !row.publishedAt) row.publishedAt = new Date().toISOString();
    row.updatedAt = new Date().toISOString();
    await writeJson(CAMPAIGNS_FILE, all);
    return row;
  },
};

export const jsonFlipPageStore = {
  async listByCampaign(campaignId: string): Promise<FlipPage[]> {
    const all = await readJson<FlipPage[]>(PAGES_FILE, []);
    return all
      .filter((p) => p.campaignId === campaignId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async get(id: string): Promise<FlipPage | undefined> {
    const all = await readJson<FlipPage[]>(PAGES_FILE, []);
    return all.find((p) => p.id === id);
  },

  async create(page: FlipPage): Promise<FlipPage> {
    const all = await readJson<FlipPage[]>(PAGES_FILE, []);
    all.push(page);
    await writeJson(PAGES_FILE, all);
    return page;
  },

  async update(
    id: string,
    patch: Partial<Pick<FlipPage, "pageType" | "headline" | "body" | "mediaUrl" | "ctaType" | "ctaLabel" | "ctaValue">>
  ): Promise<FlipPage | undefined> {
    const all = await readJson<FlipPage[]>(PAGES_FILE, []);
    const row = all.find((p) => p.id === id);
    if (!row) return undefined;
    Object.assign(row, patch);
    row.updatedAt = new Date().toISOString();
    await writeJson(PAGES_FILE, all);
    return row;
  },

  async remove(id: string): Promise<boolean> {
    const all = await readJson<FlipPage[]>(PAGES_FILE, []);
    const next = all.filter((p) => p.id !== id);
    if (next.length === all.length) return false;
    await writeJson(PAGES_FILE, next);
    return true;
  },

  async reorder(campaignId: string, orderedIds: string[]): Promise<void> {
    const all = await readJson<FlipPage[]>(PAGES_FILE, []);
    orderedIds.forEach((id, idx) => {
      const row = all.find((p) => p.id === id && p.campaignId === campaignId);
      if (row) row.sortOrder = idx;
    });
    await writeJson(PAGES_FILE, all);
  },
};
