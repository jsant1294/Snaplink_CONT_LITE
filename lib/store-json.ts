// ---------------------------------------------------------------------------
// MVP persistence: file-based JSON at .data/leads.json
// Interface is deliberately repo-shaped so it can be swapped for a
// Drizzle + Postgres/SQLite implementation without touching API routes.
// NOTE: works for local/dev and single-instance hosts. Not for serverless
// (Vercel functions have an ephemeral filesystem) — swap before deploying.
// ---------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import type { Lead, LeadStatus, AiSummary, Contractor, Estimate, Payment } from "./types";
import { CONTRACTOR_SEEDS } from "./contractors";

const DATA_DIR = path.join(process.cwd(), ".data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(LEADS_FILE);
  } catch {
    await fs.writeFile(LEADS_FILE, "[]", "utf-8");
  }
}

async function readAll(): Promise<Lead[]> {
  await ensureFile();
  const raw = await fs.readFile(LEADS_FILE, "utf-8");
  try {
    return JSON.parse(raw) as Lead[];
  } catch {
    return [];
  }
}

async function writeAll(leads: Lead[]): Promise<void> {
  await ensureFile();
  const tmp = LEADS_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(leads, null, 2), "utf-8");
  await fs.rename(tmp, LEADS_FILE);
}

export const jsonLeadStore = {
  async list(contractorUsername?: string): Promise<Lead[]> {
    const leads = await readAll();
    const filtered = contractorUsername
      ? leads.filter((l) => l.contractorUsername === contractorUsername)
      : leads;
    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async get(id: string): Promise<Lead | undefined> {
    const leads = await readAll();
    return leads.find((l) => l.id === id);
  },

  async create(lead: Lead): Promise<Lead> {
    const leads = await readAll();
    leads.push(lead);
    await writeAll(leads);
    return lead;
  },

  async updateStatus(id: string, status: LeadStatus): Promise<Lead | undefined> {
    const leads = await readAll();
    const lead = leads.find((l) => l.id === id);
    if (!lead) return undefined;
    lead.status = status;
    lead.updatedAt = new Date().toISOString();
    await writeAll(leads);
    return lead;
  },

  async attachAi(id: string, ai: AiSummary): Promise<Lead | undefined> {
    const leads = await readAll();
    const lead = leads.find((l) => l.id === id);
    if (!lead) return undefined;
    lead.ai = ai;
    lead.updatedAt = new Date().toISOString();
    await writeAll(leads);
    return lead;
  },
  async recordPayment(id: string, payment: Payment): Promise<Lead | undefined> {
    const leads = await readAll();
    const lead = leads.find((l) => l.id === id);
    if (!lead) return undefined;
    lead.payments = [...(lead.payments ?? []), payment];
    lead.updatedAt = new Date().toISOString();
    await writeAll(leads);
    return lead;
  },
  async removePayment(id: string, paymentId: string): Promise<Lead | undefined> {
    const leads = await readAll();
    const lead = leads.find((l) => l.id === id);
    if (!lead) return undefined;
    lead.payments = (lead.payments ?? []).filter((p) => p.id !== paymentId);
    lead.updatedAt = new Date().toISOString();
    await writeAll(leads);
    return lead;
  },
};


// --- Contractors -------------------------------------------------------------

const CONTRACTORS_FILE = path.join(DATA_DIR, "contractors.json");

async function readContractors(): Promise<Contractor[]> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(CONTRACTORS_FILE, "utf-8");
    return JSON.parse(raw) as Contractor[];
  } catch {
    // Seed on first access with the demo profiles.
    await fs.writeFile(CONTRACTORS_FILE, JSON.stringify(CONTRACTOR_SEEDS, null, 2), "utf-8");
    return [...CONTRACTOR_SEEDS];
  }
}

async function writeContractors(list: Contractor[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = CONTRACTORS_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf-8");
  await fs.rename(tmp, CONTRACTORS_FILE);
}

export const jsonContractorStore = {
  async list(): Promise<Contractor[]> {
    return readContractors();
  },
  async getByUsername(username: string): Promise<Contractor | undefined> {
    const list = await readContractors();
    return list.find((c) => c.username === username.toLowerCase());
  },
  async getById(id: string): Promise<Contractor | undefined> {
    const list = await readContractors();
    return list.find((c) => c.id === id);
  },
  async create(c: Contractor): Promise<Contractor> {
    const list = await readContractors();
    if (list.some((x) => x.username === c.username)) {
      throw new Error(`Username "${c.username}" is already taken`);
    }
    list.push(c);
    await writeContractors(list);
    return c;
  },
  async update(
    id: string,
    patch: Partial<Pick<Contractor, "pin" | "preferredLanguage" | "payments">>
  ): Promise<Contractor | undefined> {
    const list = await readContractors();
    const c = list.find((x) => x.id === id);
    if (!c) return undefined;
    if (patch.pin !== undefined) c.pin = patch.pin;
    if (patch.preferredLanguage !== undefined) c.preferredLanguage = patch.preferredLanguage;
    if (patch.payments !== undefined) c.payments = patch.payments;
    await writeContractors(list);
    return c;
  },
};

// --- Estimates ---------------------------------------------------------------

const ESTIMATES_FILE = path.join(DATA_DIR, "estimates.json");

async function readEstimates(): Promise<Estimate[]> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(ESTIMATES_FILE, "utf-8");
    return JSON.parse(raw) as Estimate[];
  } catch {
    await fs.writeFile(ESTIMATES_FILE, "[]", "utf-8");
    return [];
  }
}

async function writeEstimates(list: Estimate[]): Promise<void> {
  const tmp = ESTIMATES_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf-8");
  await fs.rename(tmp, ESTIMATES_FILE);
}

export const jsonEstimateStore = {
  async getByLead(leadId: string): Promise<Estimate | undefined> {
    const list = await readEstimates();
    return list.find((e) => e.leadId === leadId);
  },
  /** One estimate per lead for MVP — upsert by leadId. */
  async upsert(estimate: Estimate): Promise<Estimate> {
    const list = await readEstimates();
    const idx = list.findIndex((e) => e.leadId === estimate.leadId);
    estimate.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      estimate.id = list[idx].id;
      estimate.createdAt = list[idx].createdAt;
      list[idx] = estimate;
    } else {
      list.push(estimate);
    }
    await writeEstimates(list);
    return estimate;
  },
};


