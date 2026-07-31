// ---------------------------------------------------------------------------
// MVP persistence: file-based JSON at .data/agent-profiles.json
// Same interface as store-pg.ts. Local/dev demos only — never for serverless
// (ephemeral filesystem = data loss), same caveat as lib/store-json.ts.
// ---------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import type { AgentProfile, AgentProfileRequestInput } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "agent-profiles.json");

async function read(): Promise<AgentProfile[]> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    return JSON.parse(await fs.readFile(FILE, "utf-8")) as AgentProfile[];
  } catch {
    await fs.writeFile(FILE, "[]", "utf-8");
    return [];
  }
}

async function write(list: AgentProfile[]): Promise<void> {
  const tmp = FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf-8");
  await fs.rename(tmp, FILE);
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const jsonAgentProfileStore = {
  async list(): Promise<AgentProfile[]> {
    return read();
  },
  async listActive(): Promise<AgentProfile[]> {
    return (await read()).filter((p) => p.status === "active");
  },
  async listPending(): Promise<AgentProfile[]> {
    return (await read()).filter((p) => p.status === "pending");
  },
  async getBySlug(slug: string): Promise<AgentProfile | undefined> {
    return (await read()).find((p) => p.slug === slug);
  },
  async getById(id: string): Promise<AgentProfile | undefined> {
    return (await read()).find((p) => p.id === id);
  },
  async create(id: string, input: AgentProfileRequestInput): Promise<AgentProfile> {
    const list = await read();
    let slug = slugify(input.name) || id;
    if (list.some((p) => p.slug === slug)) slug = `${slug}-${id.slice(-6)}`;
    const now = new Date().toISOString();
    const profile: AgentProfile = {
      id,
      slug,
      status: "pending",
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      serviceArea: input.serviceArea.trim(),
      brokerageName: input.brokerageName?.trim() || "",
      licenseNumber: input.licenseNumber?.trim() || "",
      bio: input.bio?.trim() || "",
      tagline: input.tagline?.trim(),
      photoUrl: input.photoUrl,
      languages: input.languages ?? [],
      specialties: input.specialties ?? [],
      serviceAreas: input.serviceAreas ?? [],
      yearsExperience: input.yearsExperience,
      createdAt: now,
      updatedAt: now,
    };
    list.push(profile);
    await write(list);
    return profile;
  },
  async update(id: string, patch: Partial<Omit<AgentProfile, "id" | "slug" | "createdAt">>): Promise<AgentProfile | undefined> {
    const list = await read();
    const profile = list.find((p) => p.id === id);
    if (!profile) return undefined;
    Object.assign(profile, patch, { updatedAt: new Date().toISOString() });
    await write(list);
    return profile;
  },
};
