// ---------------------------------------------------------------------------
// Lucio Financial Copilot — file-based JSON store (local/dev only).
// Same conventions as lib/store-json.ts: atomic temp-file writes, soft delete.
// Never use this mode on serverless (ephemeral filesystem = data loss).
// ---------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import type { Expense, ExpenseCategory, TaxProfile, Payee, Form1099Received, TaxSetAside } from "./money-types";
import { DEFAULT_CATEGORY_SEEDS } from "./expense-categories";

const DATA_DIR = path.join(process.cwd(), ".data");
const EXPENSES_FILE = path.join(DATA_DIR, "expenses.json");
const CATEGORIES_FILE = path.join(DATA_DIR, "expense-categories.json");
const TAX_PROFILES_FILE = path.join(DATA_DIR, "tax-profiles.json");
const PAYEES_FILE = path.join(DATA_DIR, "payees.json");
const FORMS1099_FILE = path.join(DATA_DIR, "forms-1099.json");
const SETASIDES_FILE = path.join(DATA_DIR, "tax-setasides.json");

/** Rows carry a soft-delete marker, same as the Postgres table. */
type StoredExpense = Expense & { deletedAt?: string };
type StoredCategory = ExpenseCategory & { archivedAt?: string };
type StoredPayee = Payee & { deletedAt?: string };
type StoredForm1099 = Form1099Received & { deletedAt?: string };

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

export const jsonExpenseStore = {
  async list(
    contractorId: string,
    opts?: { year?: number; leadId?: string | null }
  ): Promise<Expense[]> {
    const all = await readJson<StoredExpense[]>(EXPENSES_FILE, []);
    return all
      .filter((e) => e.contractorId === contractorId && !e.deletedAt)
      .filter((e) => {
        if (!opts || !("leadId" in opts)) return true;
        return opts.leadId === null ? !e.leadId : e.leadId === opts.leadId;
      })
      .filter((e) => (opts?.year ? e.spentOn.startsWith(`${opts.year}-`) : true))
      .sort((a, b) => b.spentOn.localeCompare(a.spentOn));
  },

  async get(id: string): Promise<Expense | undefined> {
    const all = await readJson<StoredExpense[]>(EXPENSES_FILE, []);
    const found = all.find((e) => e.id === id && !e.deletedAt);
    return found;
  },

  async create(expense: Expense, receipt?: { dataUrl: string; filename: string }): Promise<Expense> {
    const all = await readJson<StoredExpense[]>(EXPENSES_FILE, []);
    const row: StoredExpense = {
      ...expense,
      receiptUrl: receipt?.dataUrl ?? expense.receiptUrl,
      receiptFilename: receipt?.filename ?? expense.receiptFilename,
    };
    all.push(row);
    await writeJson(EXPENSES_FILE, all);
    return row;
  },

  async update(
    id: string,
    patch: Partial<
      Pick<Expense, "categoryId" | "amountCents" | "spentOn" | "vendor" | "note" | "billedToClient" | "leadId" | "payeeId">
    >
  ): Promise<Expense | undefined> {
    const all = await readJson<StoredExpense[]>(EXPENSES_FILE, []);
    const row = all.find((e) => e.id === id && !e.deletedAt);
    if (!row) return undefined;
    if (patch.categoryId !== undefined) row.categoryId = patch.categoryId;
    if (patch.amountCents !== undefined) row.amountCents = patch.amountCents;
    if (patch.spentOn !== undefined) row.spentOn = patch.spentOn;
    if (patch.vendor !== undefined) row.vendor = patch.vendor;
    if (patch.note !== undefined) row.note = patch.note;
    if (patch.billedToClient !== undefined) row.billedToClient = patch.billedToClient;
    if ("leadId" in patch) row.leadId = patch.leadId ?? undefined;
    if ("payeeId" in patch) row.payeeId = patch.payeeId ?? undefined;
    row.updatedAt = new Date().toISOString();
    await writeJson(EXPENSES_FILE, all);
    return row;
  },

  async softDelete(id: string): Promise<boolean> {
    const all = await readJson<StoredExpense[]>(EXPENSES_FILE, []);
    const row = all.find((e) => e.id === id && !e.deletedAt);
    if (!row) return false;
    row.deletedAt = new Date().toISOString();
    row.updatedAt = row.deletedAt;
    await writeJson(EXPENSES_FILE, all);
    return true;
  },
};

export const jsonCategoryStore = {
  async list(contractorId: string): Promise<ExpenseCategory[]> {
    const all = await readJson<StoredCategory[]>(CATEGORIES_FILE, [...DEFAULT_CATEGORY_SEEDS]);
    return all
      .filter((c) => !c.archivedAt)
      .filter((c) => !c.contractorId || c.contractorId === contractorId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async create(category: ExpenseCategory): Promise<ExpenseCategory> {
    const all = await readJson<StoredCategory[]>(CATEGORIES_FILE, [...DEFAULT_CATEGORY_SEEDS]);
    all.push(category);
    await writeJson(CATEGORIES_FILE, all);
    return category;
  },

  async archive(id: string): Promise<boolean> {
    const all = await readJson<StoredCategory[]>(CATEGORIES_FILE, [...DEFAULT_CATEGORY_SEEDS]);
    const row = all.find((c) => c.id === id);
    if (!row) return false;
    row.archivedAt = new Date().toISOString();
    await writeJson(CATEGORIES_FILE, all);
    return true;
  },
};

export const jsonTaxProfileStore = {
  async get(contractorId: string): Promise<TaxProfile | undefined> {
    const all = await readJson<TaxProfile[]>(TAX_PROFILES_FILE, []);
    return all.find((p) => p.contractorId === contractorId);
  },

  async upsert(profile: TaxProfile): Promise<TaxProfile> {
    const all = await readJson<TaxProfile[]>(TAX_PROFILES_FILE, []);
    const idx = all.findIndex((p) => p.contractorId === profile.contractorId);
    const now = new Date().toISOString();
    if (idx >= 0) {
      const merged = { ...profile, id: all[idx].id, createdAt: all[idx].createdAt, updatedAt: now };
      all[idx] = merged;
      await writeJson(TAX_PROFILES_FILE, all);
      return merged;
    }
    const created = { ...profile, updatedAt: now };
    all.push(created);
    await writeJson(TAX_PROFILES_FILE, all);
    return created;
  },
};

// --- Delivery 2: payees + 1099s received ------------------------------------

export const jsonPayeeStore = {
  async list(contractorId: string): Promise<Payee[]> {
    const all = await readJson<StoredPayee[]>(PAYEES_FILE, []);
    return all
      .filter((p) => p.contractorId === contractorId && !p.deletedAt)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  async get(id: string): Promise<Payee | undefined> {
    const all = await readJson<StoredPayee[]>(PAYEES_FILE, []);
    return all.find((p) => p.id === id && !p.deletedAt);
  },
  async create(payee: Payee, w9Doc?: { dataUrl: string; filename: string }): Promise<Payee> {
    const all = await readJson<StoredPayee[]>(PAYEES_FILE, []);
    const row: StoredPayee = {
      ...payee,
      w9DocUrl: w9Doc?.dataUrl ?? payee.w9DocUrl,
      w9DocFilename: w9Doc?.filename ?? payee.w9DocFilename,
      w9OnFile: w9Doc ? true : payee.w9OnFile,
    };
    all.push(row);
    await writeJson(PAYEES_FILE, all);
    return row;
  },
  async update(
    id: string,
    patch: Partial<Omit<Payee, "id" | "contractorId" | "createdAt" | "updatedAt">>,
    w9Doc?: { dataUrl: string; filename: string }
  ): Promise<Payee | undefined> {
    const all = await readJson<StoredPayee[]>(PAYEES_FILE, []);
    const row = all.find((p) => p.id === id && !p.deletedAt);
    if (!row) return undefined;
    Object.assign(row, patch);
    if (w9Doc?.dataUrl) {
      row.w9DocUrl = w9Doc.dataUrl;
      row.w9DocFilename = w9Doc.filename;
      row.w9OnFile = true;
    }
    row.updatedAt = new Date().toISOString();
    await writeJson(PAYEES_FILE, all);
    return row;
  },
  async softDelete(id: string): Promise<boolean> {
    const all = await readJson<StoredPayee[]>(PAYEES_FILE, []);
    const row = all.find((p) => p.id === id && !p.deletedAt);
    if (!row) return false;
    row.deletedAt = new Date().toISOString();
    await writeJson(PAYEES_FILE, all);
    return true;
  },
};

export const jsonForm1099Store = {
  async list(contractorId: string, taxYear?: number): Promise<Form1099Received[]> {
    const all = await readJson<StoredForm1099[]>(FORMS1099_FILE, []);
    return all
      .filter((f) => f.contractorId === contractorId && !f.deletedAt)
      .filter((f) => (taxYear ? f.taxYear === taxYear : true))
      .sort((a, b) => a.issuerName.localeCompare(b.issuerName));
  },
  async get(id: string): Promise<Form1099Received | undefined> {
    const all = await readJson<StoredForm1099[]>(FORMS1099_FILE, []);
    return all.find((f) => f.id === id && !f.deletedAt);
  },
  async create(form: Form1099Received, doc?: { dataUrl: string; filename: string }): Promise<Form1099Received> {
    const all = await readJson<StoredForm1099[]>(FORMS1099_FILE, []);
    const row: StoredForm1099 = {
      ...form,
      docUrl: doc?.dataUrl ?? form.docUrl,
      docFilename: doc?.filename ?? form.docFilename,
    };
    all.push(row);
    await writeJson(FORMS1099_FILE, all);
    return row;
  },
  async update(
    id: string,
    patch: Partial<Pick<Form1099Received, "taxYear" | "issuerName" | "formType" | "amountCents" | "notes">>
  ): Promise<Form1099Received | undefined> {
    const all = await readJson<StoredForm1099[]>(FORMS1099_FILE, []);
    const row = all.find((f) => f.id === id && !f.deletedAt);
    if (!row) return undefined;
    Object.assign(row, patch);
    row.updatedAt = new Date().toISOString();
    await writeJson(FORMS1099_FILE, all);
    return row;
  },
  async softDelete(id: string): Promise<boolean> {
    const all = await readJson<StoredForm1099[]>(FORMS1099_FILE, []);
    const row = all.find((f) => f.id === id && !f.deletedAt);
    if (!row) return false;
    row.deletedAt = new Date().toISOString();
    await writeJson(FORMS1099_FILE, all);
    return true;
  },
};

// --- Delivery 3: tax set-asides ---------------------------------------------

type StoredSetAside = TaxSetAside & { deletedAt?: string };

export const jsonSetAsideStore = {
  async list(contractorId: string, taxYear?: number): Promise<TaxSetAside[]> {
    const all = await readJson<StoredSetAside[]>(SETASIDES_FILE, []);
    return all
      .filter((s) => s.contractorId === contractorId && !s.deletedAt)
      .filter((s) => (taxYear ? s.taxYear === taxYear : true))
      .sort((a, b) => b.movedOn.localeCompare(a.movedOn));
  },
  async get(id: string): Promise<TaxSetAside | undefined> {
    const all = await readJson<StoredSetAside[]>(SETASIDES_FILE, []);
    return all.find((s) => s.id === id && !s.deletedAt);
  },
  async create(entry: TaxSetAside): Promise<TaxSetAside> {
    const all = await readJson<StoredSetAside[]>(SETASIDES_FILE, []);
    all.push(entry);
    await writeJson(SETASIDES_FILE, all);
    return entry;
  },
  async softDelete(id: string): Promise<boolean> {
    const all = await readJson<StoredSetAside[]>(SETASIDES_FILE, []);
    const row = all.find((s) => s.id === id && !s.deletedAt);
    if (!row) return false;
    row.deletedAt = new Date().toISOString();
    await writeJson(SETASIDES_FILE, all);
    return true;
  },
};
