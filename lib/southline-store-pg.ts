// ---------------------------------------------------------------------------
// Southline settings — Postgres store. Same interface as jsonSouthlineStore
// (lib/southline-store-json.ts). See lib/db/schema.ts southlineSettings for
// why this is one jsonb blob instead of a relational table.
// ---------------------------------------------------------------------------

import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { southlineSettings } from "./db/schema";
import type { SouthlineSettings } from "./southline-types";
import { defaultSouthlineSettings, mergeLocalDiscoveryContent } from "./southline-types";
import { mergeSeoContent } from "./southline-seo";
import { databaseUrl, sslConfig } from "./db-url";

const ROW_ID = "default";

let _db: NodePgDatabase | null = null;

function db(): NodePgDatabase {
  if (!_db) {
    const pool = new Pool({ connectionString: databaseUrl, ssl: sslConfig, max: 5 });
    _db = drizzle(pool);
  }
  return _db;
}

// Mirrors jsonSouthlineStore's mergeWithDefaults — a stored row predates
// whatever code shipped after it was written, so every read merges against
// current code defaults (new fields/nav items appear; operator edits stick).
function mergeWithDefaults(stored: Partial<SouthlineSettings>): SouthlineSettings {
  const defaults = defaultSouthlineSettings();
  const storedByKey = new Map((stored.navigation?.items ?? []).map((item) => [item.key, item]));
  const orderedFromDefaults = defaults.navigation.items.map((item) => storedByKey.get(item.key) ?? item);
  const customExtras = (stored.navigation?.items ?? []).filter(
    (item) => !defaults.navigation.items.some((d) => d.key === item.key)
  );
  const trendingByKey = new Map((stored.trendingProjects ?? []).map((item) => [item.id, item]));
  const trendingOrdered = defaults.trendingProjects.map((item) => trendingByKey.get(item.id) ?? item);
  const trendingExtras = (stored.trendingProjects ?? []).filter(
    (item) => !defaults.trendingProjects.some((d) => d.id === item.id)
  );
  const categoriesByKey = new Map((stored.categories ?? []).map((item) => [item.id, item]));
  const categoriesOrdered = defaults.categories.map((item) => categoriesByKey.get(item.id) ?? item);
  const categoriesExtras = (stored.categories ?? []).filter(
    (item) => !defaults.categories.some((d) => d.id === item.id)
  );
  return {
    ...defaults,
    ...stored,
    hero: { ...defaults.hero, ...stored.hero },
    heroImage: { ...defaults.heroImage, ...stored.heroImage },
    homeServices: { ...defaults.homeServices, ...stored.homeServices },
    seasonal: { ...defaults.seasonal, ...stored.seasonal },
    trendingProjects: [...trendingOrdered, ...trendingExtras],
    categories: [...categoriesOrdered, ...categoriesExtras],
    sections: { ...defaults.sections, ...stored.sections },
    realEstateBlock: { ...defaults.realEstateBlock, ...stored.realEstateBlock },
    featureFlags: { ...defaults.featureFlags, ...stored.featureFlags },
    faq: { ...defaults.faq, ...stored.faq, items: stored.faq?.items ?? defaults.faq.items },
    footer: { ...defaults.footer, ...stored.footer, columns: stored.footer?.columns ?? defaults.footer.columns },
    contact: { ...defaults.contact, ...stored.contact, hours: stored.contact?.hours ?? defaults.contact.hours },
    testimonials: {
      ...defaults.testimonials,
      ...stored.testimonials,
      items: stored.testimonials?.items ?? defaults.testimonials.items,
    },
    localDiscovery: mergeLocalDiscoveryContent(stored.localDiscovery),
    seo: mergeSeoContent(stored.seo),
    navigation: { items: [...orderedFromDefaults, ...customExtras] },
  };
}

async function read(): Promise<SouthlineSettings> {
  const rows = await db().select().from(southlineSettings).where(eq(southlineSettings.id, ROW_ID)).limit(1);
  if (!rows[0]) {
    const defaults = defaultSouthlineSettings();
    await db()
      .insert(southlineSettings)
      .values({ id: ROW_ID, data: defaults, updatedAt: new Date().toISOString() })
      .onConflictDoNothing();
    return defaults;
  }
  return mergeWithDefaults(rows[0].data as Partial<SouthlineSettings>);
}

async function write(settings: SouthlineSettings): Promise<void> {
  settings.updatedAt = new Date().toISOString();
  await db()
    .insert(southlineSettings)
    .values({ id: ROW_ID, data: settings, updatedAt: settings.updatedAt })
    .onConflictDoUpdate({ target: southlineSettings.id, set: { data: settings, updatedAt: settings.updatedAt } });
}

export const pgSouthlineStore = {
  async getSettings(): Promise<SouthlineSettings> {
    return read();
  },

  async updateSettings(patch: Partial<SouthlineSettings>): Promise<SouthlineSettings> {
    const current = await read();
    const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
    await write(updated);
    return updated;
  },

  async resetSettings(): Promise<SouthlineSettings> {
    const defaults = defaultSouthlineSettings();
    await write(defaults);
    return defaults;
  },

  async getFeatureFlags(): Promise<Record<string, boolean>> {
    const settings = await read();
    return settings.featureFlags;
  },

  async updateFeatureFlags(flags: Record<string, boolean>): Promise<Record<string, boolean>> {
    const current = await read();
    current.featureFlags = { ...current.featureFlags, ...flags };
    await write(current);
    return current.featureFlags;
  },

  async isFeatureEnabled(flag: string): Promise<boolean> {
    const flags = await this.getFeatureFlags();
    return flags[flag] ?? false;
  },
};
