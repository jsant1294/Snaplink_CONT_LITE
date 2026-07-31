import { promises as fs } from "fs";
import path from "path";
import type { SouthlineSettings } from "./southline-types";
import { defaultSouthlineSettings } from "./southline-types";

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
  const storedByKey = new Map((stored.navigation?.items ?? []).map((item) => [item.key, item]));
  const orderedFromDefaults = defaults.navigation.items.map((item) => storedByKey.get(item.key) ?? item);
  const customExtras = (stored.navigation?.items ?? []).filter(
    (item) => !defaults.navigation.items.some((d) => d.key === item.key)
  );
  return {
    ...defaults,
    ...stored,
    hero: { ...defaults.hero, ...stored.hero },
    sections: { ...defaults.sections, ...stored.sections },
    realEstateBlock: { ...defaults.realEstateBlock, ...stored.realEstateBlock },
    featureFlags: { ...defaults.featureFlags, ...stored.featureFlags },
    seo: { ...defaults.seo, ...stored.seo },
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
