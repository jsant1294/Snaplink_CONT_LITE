// ---------------------------------------------------------------------------
// TRUE GEO v1 — file-based JSON store for zip_centroids (local demos / tests).
// Same interface as pgZipCentroidStore; API routes never know which backend
// is live. Local dev only — production always uses Postgres.
// ---------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import { normalizeZip } from "./zip";
import type { ZipCentroid } from "./zip-centroids";

const FILE = path.join(process.cwd(), ".data", "zip-centroids.json");

async function readAll(): Promise<ZipCentroid[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return Array.isArray(JSON.parse(raw)) ? (JSON.parse(raw) as ZipCentroid[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(list: ZipCentroid[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf-8");
  await fs.rename(tmp, FILE);
}

export const jsonZipCentroidStore = {
  async find(zip: string | null | undefined): Promise<ZipCentroid | undefined> {
    const cleaned = normalizeZip(zip);
    if (!cleaned) return undefined;
    const list = await readAll();
    return list.find((c) => c.zip === cleaned);
  },

  async listByZips(zips: Iterable<string | null | undefined>): Promise<Map<string, ZipCentroid>> {
    const wanted = new Set<string>();
    for (const z of zips) {
      const cleaned = normalizeZip(z);
      if (cleaned) wanted.add(cleaned);
    }
    const map = new Map<string, ZipCentroid>();
    if (wanted.size === 0) return map;
    const list = await readAll();
    for (const c of list) if (wanted.has(c.zip)) map.set(c.zip, c);
    return map;
  },

  async count(): Promise<number> {
    return (await readAll()).length;
  },

  async importRows(rows: readonly ZipCentroid[]): Promise<{ upserted: number }> {
    const byZip = new Map<string, ZipCentroid>();
    for (const r of rows) {
      const cleaned = normalizeZip(r.zip);
      if (cleaned) byZip.set(cleaned, { ...r, zip: cleaned });
    }
    await writeAll([...byZip.values()]);
    return { upserted: byZip.size };
  },
};