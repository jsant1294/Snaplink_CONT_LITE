// ---------------------------------------------------------------------------
// Invoices — file-based JSON store (local/dev only). Never actually reachable
// in practice: lib/stripe/config.ts's stripeEnabled() requires usePg, so the
// Invoices tab and every API route stay in the "disabled" state whenever this
// backend is live. Kept for dual-store-pattern consistency.
// ---------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import type { Invoice, InvoiceStatus } from "./invoice-types";

const DATA_DIR = path.join(process.cwd(), ".data");
const INVOICES_FILE = path.join(DATA_DIR, "invoices.json");

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

export const jsonInvoiceStore = {
  async list(contractorId: string): Promise<Invoice[]> {
    const all = await readJson<Invoice[]>(INVOICES_FILE, []);
    return all
      .filter((i) => i.contractorId === contractorId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async get(id: string): Promise<Invoice | undefined> {
    const all = await readJson<Invoice[]>(INVOICES_FILE, []);
    return all.find((i) => i.id === id);
  },

  async getByToken(token: string): Promise<Invoice | undefined> {
    const all = await readJson<Invoice[]>(INVOICES_FILE, []);
    return all.find((i) => i.publicToken === token);
  },

  async create(invoice: Invoice): Promise<Invoice> {
    const all = await readJson<Invoice[]>(INVOICES_FILE, []);
    all.push(invoice);
    await writeJson(INVOICES_FILE, all);
    return invoice;
  },

  async setStripeDetails(
    id: string,
    patch: { providerInvoiceId: string; hostedInvoiceUrl?: string; invoicePdfUrl?: string; status: InvoiceStatus }
  ): Promise<Invoice | undefined> {
    const all = await readJson<Invoice[]>(INVOICES_FILE, []);
    const row = all.find((i) => i.id === id);
    if (!row) return undefined;
    Object.assign(row, patch);
    row.updatedAt = new Date().toISOString();
    await writeJson(INVOICES_FILE, all);
    return row;
  },

  async setStatusByProviderId(providerInvoiceId: string, status: InvoiceStatus): Promise<Invoice | undefined> {
    const all = await readJson<Invoice[]>(INVOICES_FILE, []);
    const row = all.find((i) => i.providerInvoiceId === providerInvoiceId);
    if (!row) return undefined;
    row.status = status;
    row.updatedAt = new Date().toISOString();
    await writeJson(INVOICES_FILE, all);
    return row;
  },
};
