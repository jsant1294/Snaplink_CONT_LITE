import { promises as fs } from "fs";
import path from "path";
import type { SouthlineSettings } from "./southline-types";
import { defaultSouthlineSettings, mergeLocalDiscoveryContent, mergeSnapLinkPromoContent } from "./southline-types";
import { mergeSeoContent } from "./southline-seo";

const DATA_DIR = path.join(process.cwd(), ".data");
const SETTINGS_FILE = path.join(DATA_DIR, "southline-settings.json");

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(SETTINGS_FILE);
  } catch {
    await fs.writeFile(
      SETTINGS_FILE,
      JSON.stringify(defaultSouthlineSettings(), null, 2),
      "utf-8"
    );
  }
}

// A stored settings file predates whatever code shipped after it was first written —
// a plain JSON.parse silently drops any field or nav item added since (this has already
// caused two real "the nav doesn't show X" bugs). Merge against current code defaults on
// every read so new top-level fields, nested objects, and nav entries always appear,
// while any operator customization (a changed href/label/visibility, or a custom item
// added via the CMS) is preserved.
function mergeWithDefaults(stored: Partial<SouthlineSettings>): SouthlineSettings {
  const defaults = defaultSouthlineSettings();
  // Renamed nav keys from earlier slices are retired here so a stale stored item
  // never survives the merge as an orphan customExtra (Rentals & Getaways slice:
  // navRealEstate → navRentals). Keep in sync with any future renames.
  const RETIRED_NAV_KEYS = ["navRealEstate"];
  const storedNavItems = (stored.navigation?.items ?? []).filter(
    (item) => !RETIRED_NAV_KEYS.includes(item.key)
  );
  const storedByKey = new Map(storedNavItems.map((item) => [item.key, item]));
  const orderedFromDefaults = defaults.navigation.items.map((item) => storedByKey.get(item.key) ?? item);
  const customExtras = storedNavItems.filter(
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
    testimonials: { ...defaults.testimonials, ...stored.testimonials, items: stored.testimonials?.items ?? defaults.testimonials.items },
    localDiscovery: mergeLocalDiscoveryContent(stored.localDiscovery),
    snapLinkPromo: mergeSnapLinkPromoContent(stored.snapLinkPromo),
    seo: mergeSeoContent(stored.seo),
    navigation: { items: [...orderedFromDefaults, ...customExtras] },
  };
}

async function read(): Promise<SouthlineSettings> {
  await ensureFile();
  try {
    const raw = await fs.readFile(SETTINGS_FILE, "utf-8");
    return mergeWithDefaults(JSON.parse(raw) as Partial<SouthlineSettings>);
  } catch {
    const defaults = defaultSouthlineSettings();
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(defaults, null, 2), "utf-8");
    return defaults;
  }
}

async function write(settings: SouthlineSettings): Promise<void> {
  await ensureFile();
  settings.updatedAt = new Date().toISOString();
  const tmp = SETTINGS_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(settings, null, 2), "utf-8");
  await fs.rename(tmp, SETTINGS_FILE);
}

export const jsonSouthlineStore = {
  async getSettings(): Promise<SouthlineSettings> {
    return read();
  },

  async updateSettings(
    patch: Partial<SouthlineSettings>
  ): Promise<SouthlineSettings> {
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

  async updateFeatureFlags(
    flags: Record<string, boolean>
  ): Promise<Record<string, boolean>> {
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
