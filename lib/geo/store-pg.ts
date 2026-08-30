// ---------------------------------------------------------------------------
// TRUE GEO v1 — Postgres store for the zip_centroids reference table.
// Read paths used by public search; importRows is the idempotent loader the
// documented dataset import script drives (docs/geo/ZIP_CENTROIDS.md).
// ---------------------------------------------------------------------------

import { eq, inArray, count, sql } from "drizzle-orm";
import { zipCentroids } from "../db/schema";
import { db } from "../db/connection";
import { normalizeZip } from "./zip";
import type { ZipCentroid } from "./zip-centroids";

type Row = typeof zipCentroids.$inferSelect;

function rowToCentroid(row: Row): ZipCentroid | undefined {
  if (row.latitude == null || row.longitude == null) return undefined;
  return {
    zip: row.zip,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

const CHUNK_SIZE = 1000;

export const pgZipCentroidStore = {
  async find(zip: string | null | undefined): Promise<ZipCentroid | undefined> {
    const cleaned = normalizeZip(zip);
    if (!cleaned) return undefined;
    const rows = await db().select().from(zipCentroids).where(eq(zipCentroids.zip, cleaned)).limit(1);
    return rows[0] ? rowToCentroid(rows[0]) : undefined;
  },

  /** Single-query batch lookup (no N+1) for a set of professional service ZIPs. */
  async listByZips(zips: Iterable<string | null | undefined>): Promise<Map<string, ZipCentroid>> {
    const wanted = new Set<string>();
    for (const z of zips) {
      const cleaned = normalizeZip(z);
      if (cleaned) wanted.add(cleaned);
    }
    const map = new Map<string, ZipCentroid>();
    if (wanted.size === 0) return map;
    const rows = await db().select().from(zipCentroids).where(inArray(zipCentroids.zip, [...wanted]));
    for (const r of rows) {
      const c = rowToCentroid(r);
      if (c) map.set(c.zip, c);
    }
    return map;
  },

  async count(): Promise<number> {
    const [{ value }] = await db().select({ value: count() }).from(zipCentroids);
    return value;
  },

  /** Idempotent batch upsert (zip PK). Chunked for Neon/prepared-statement limits. */
  async importRows(rows: readonly ZipCentroid[]): Promise<{ upserted: number }> {
    let upserted = 0;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE).map((r) => ({
        zip: normalizeZip(r.zip),
        city: r.city ?? null,
        state: r.state ?? null,
        latitude: r.latitude,
        longitude: r.longitude,
      }));
      await db()
        .insert(zipCentroids)
        .values(chunk)
        .onConflictDoUpdate({
          target: zipCentroids.zip,
          set: {
            city: sql`excluded.city`,
            state: sql`excluded.state`,
            latitude: sql`excluded.latitude`,
            longitude: sql`excluded.longitude`,
          },
        });
      upserted += chunk.length;
    }
    return { upserted };
  },
};