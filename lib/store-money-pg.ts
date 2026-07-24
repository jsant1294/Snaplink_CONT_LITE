// ---------------------------------------------------------------------------
// Lucio Financial Copilot — Postgres store.
// Same shape and conventions as lib/store-pg.ts. Money is INTEGER CENTS.
// Soft-delete only: every read excludes rows with deleted_at set.
// ---------------------------------------------------------------------------

import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq, isNull, sql } from "drizzle-orm";
import { expenses, expenseCategories, taxProfiles, payees, forms1099Received, taxSetAsides } from "./db/schema";
import { maybeUploadToBlob } from "./store-pg";
import type {
  Expense, ExpenseCategory, TaxProfile, EntityType,
  Payee, PayeeType, TinType, Form1099Received, Form1099Type, TaxSetAside,
} from "./money-types";
import { databaseUrl, sslConfig } from "./db-url";

let _db: NodePgDatabase | null = null;

function db(): NodePgDatabase {
  if (!_db) {
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: sslConfig,
      max: 5,
    });
    _db = drizzle(pool);
  }
  return _db;
}

type ExpenseRow = typeof expenses.$inferSelect;
type CategoryRow = typeof expenseCategories.$inferSelect;
type TaxProfileRow = typeof taxProfiles.$inferSelect;

function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    contractorId: row.contractorId,
    leadId: row.leadId ?? undefined,
    payeeId: row.payeeId ?? undefined,
    categoryId: row.categoryId,
    amountCents: row.amountCents,
    spentOn: row.spentOn,
    vendor: row.vendor,
    note: row.note,
    receiptUrl: row.receiptUrl ?? undefined,
    receiptFilename: row.receiptFilename ?? undefined,
    billedToClient: row.billedToClient === "true",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToCategory(row: CategoryRow): ExpenseCategory {
  return {
    id: row.id,
    contractorId: row.contractorId ?? undefined,
    key: row.key,
    labelEn: row.labelEn,
    labelEs: row.labelEs,
    scheduleCLine: row.scheduleCLine ?? undefined,
    isJobMaterial: row.isJobMaterial === "true",
    sortOrder: row.sortOrder,
  };
}

function rowToTaxProfile(row: TaxProfileRow): TaxProfile {
  return {
    id: row.id,
    contractorId: row.contractorId,
    entityType: row.entityType as EntityType,
    setAsidePercent: row.setAsidePercent,
    businessLegalName: row.businessLegalName ?? undefined,
    taxYearStartMonth: row.taxYearStartMonth,
    payeeAlertThresholdCents: row.payeeAlertThresholdCents,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const pgExpenseStore = {
  /**
   * leadId omitted     -> all expenses
   * leadId === null    -> overhead only (SQL IS NULL)
   * leadId === "lead_" -> that job's materials only
   */
  async list(
    contractorId: string,
    opts?: { year?: number; leadId?: string | null }
  ): Promise<Expense[]> {
    const filters = [eq(expenses.contractorId, contractorId), isNull(expenses.deletedAt)];
    if (opts && "leadId" in opts) {
      filters.push(opts.leadId === null ? isNull(expenses.leadId) : eq(expenses.leadId, opts.leadId!));
    }
    if (opts?.year) {
      filters.push(sql`${expenses.spentOn} LIKE ${String(opts.year) + "-%"}`);
    }
    const rows = await db()
      .select()
      .from(expenses)
      .where(and(...filters))
      .orderBy(sql`${expenses.spentOn} DESC`);
    return rows.map(rowToExpense);
  },

  async get(id: string): Promise<Expense | undefined> {
    const rows = await db()
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), isNull(expenses.deletedAt)))
      .limit(1);
    return rows[0] ? rowToExpense(rows[0]) : undefined;
  },

  async create(expense: Expense, receipt?: { dataUrl: string; filename: string }): Promise<Expense> {
    let receiptUrl = expense.receiptUrl;
    if (receipt?.dataUrl) {
      receiptUrl = await maybeUploadToBlob(
        { dataUrl: receipt.dataUrl, filename: receipt.filename },
        `receipts/${expense.contractorId}`
      );
    }
    await db().insert(expenses).values({
      id: expense.id,
      contractorId: expense.contractorId,
      leadId: expense.leadId ?? null,
      payeeId: expense.payeeId ?? null,
      categoryId: expense.categoryId,
      amountCents: expense.amountCents,
      spentOn: expense.spentOn,
      vendor: expense.vendor,
      note: expense.note,
      receiptUrl: receiptUrl ?? null,
      receiptFilename: receipt?.filename ?? expense.receiptFilename ?? null,
      billedToClient: expense.billedToClient ? "true" : "false",
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    });
    return { ...expense, receiptUrl, receiptFilename: receipt?.filename ?? expense.receiptFilename };
  },

  async update(
    id: string,
    patch: Partial<
      Pick<Expense, "categoryId" | "amountCents" | "spentOn" | "vendor" | "note" | "billedToClient" | "leadId" | "payeeId">
    >
  ): Promise<Expense | undefined> {
    const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (patch.categoryId !== undefined) set.categoryId = patch.categoryId;
    if (patch.amountCents !== undefined) set.amountCents = patch.amountCents;
    if (patch.spentOn !== undefined) set.spentOn = patch.spentOn;
    if (patch.vendor !== undefined) set.vendor = patch.vendor;
    if (patch.note !== undefined) set.note = patch.note;
    if (patch.billedToClient !== undefined) set.billedToClient = patch.billedToClient ? "true" : "false";
    if ("leadId" in patch) set.leadId = patch.leadId ?? null;
    if ("payeeId" in patch) set.payeeId = patch.payeeId ?? null;
    await db().update(expenses).set(set).where(eq(expenses.id, id));
    return this.get(id);
  },

  /** Soft delete only — the row stays for reconstruction. */
  async softDelete(id: string): Promise<boolean> {
    const existing = await this.get(id);
    if (!existing) return false;
    await db()
      .update(expenses)
      .set({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(eq(expenses.id, id));
    return true;
  },
};

export const pgCategoryStore = {
  /** System defaults (contractor_id NULL) plus this contractor's custom categories. */
  async list(contractorId: string): Promise<ExpenseCategory[]> {
    const rows = await db()
      .select()
      .from(expenseCategories)
      .where(
        and(
          isNull(expenseCategories.archivedAt),
          sql`(${expenseCategories.contractorId} IS NULL OR ${expenseCategories.contractorId} = ${contractorId})`
        )
      )
      .orderBy(expenseCategories.sortOrder);
    return rows.map(rowToCategory);
  },

  async create(category: ExpenseCategory): Promise<ExpenseCategory> {
    await db().insert(expenseCategories).values({
      id: category.id,
      contractorId: category.contractorId ?? null,
      key: category.key,
      labelEn: category.labelEn,
      labelEs: category.labelEs,
      scheduleCLine: category.scheduleCLine ?? null,
      isJobMaterial: category.isJobMaterial ? "true" : "false",
      sortOrder: category.sortOrder,
    });
    return category;
  },

  async archive(id: string): Promise<boolean> {
    await db()
      .update(expenseCategories)
      .set({ archivedAt: new Date().toISOString() })
      .where(eq(expenseCategories.id, id));
    return true;
  },
};

export const pgTaxProfileStore = {
  async get(contractorId: string): Promise<TaxProfile | undefined> {
    const rows = await db()
      .select()
      .from(taxProfiles)
      .where(eq(taxProfiles.contractorId, contractorId))
      .limit(1);
    return rows[0] ? rowToTaxProfile(rows[0]) : undefined;
  },

  async upsert(profile: TaxProfile): Promise<TaxProfile> {
    const existing = await this.get(profile.contractorId);
    const now = new Date().toISOString();
    if (existing) {
      await db()
        .update(taxProfiles)
        .set({
          entityType: profile.entityType,
          setAsidePercent: profile.setAsidePercent,
          businessLegalName: profile.businessLegalName ?? null,
          taxYearStartMonth: profile.taxYearStartMonth,
          payeeAlertThresholdCents: profile.payeeAlertThresholdCents,
          updatedAt: now,
        })
        .where(eq(taxProfiles.contractorId, profile.contractorId));
      return { ...profile, id: existing.id, createdAt: existing.createdAt, updatedAt: now };
    }
    await db().insert(taxProfiles).values({
      id: profile.id,
      contractorId: profile.contractorId,
      entityType: profile.entityType,
      setAsidePercent: profile.setAsidePercent,
      businessLegalName: profile.businessLegalName ?? null,
      taxYearStartMonth: profile.taxYearStartMonth,
      payeeAlertThresholdCents: profile.payeeAlertThresholdCents,
      createdAt: profile.createdAt,
      updatedAt: now,
    });
    return { ...profile, updatedAt: now };
  },
};

// --- Delivery 2: payees + 1099s received ------------------------------------

type PayeeRow = typeof payees.$inferSelect;
type Form1099Row = typeof forms1099Received.$inferSelect;

function rowToPayee(row: PayeeRow): Payee {
  return {
    id: row.id,
    contractorId: row.contractorId,
    name: row.name,
    payeeType: row.payeeType as PayeeType,
    legalName: row.legalName ?? undefined,
    address: row.address ?? undefined,
    tinType: row.tinType as TinType,
    tinLast4: row.tinLast4 ?? undefined,
    w9OnFile: row.w9OnFile === "true",
    w9ReceivedOn: row.w9ReceivedOn ?? undefined,
    w9DocUrl: row.w9DocUrl ?? undefined,
    w9DocFilename: row.w9DocFilename ?? undefined,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToForm1099(row: Form1099Row): Form1099Received {
  return {
    id: row.id,
    contractorId: row.contractorId,
    taxYear: row.taxYear,
    issuerName: row.issuerName,
    formType: row.formType as Form1099Type,
    amountCents: row.amountCents,
    docUrl: row.docUrl ?? undefined,
    docFilename: row.docFilename ?? undefined,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const pgPayeeStore = {
  async list(contractorId: string): Promise<Payee[]> {
    const rows = await db()
      .select()
      .from(payees)
      .where(and(eq(payees.contractorId, contractorId), isNull(payees.deletedAt)))
      .orderBy(payees.name);
    return rows.map(rowToPayee);
  },

  async get(id: string): Promise<Payee | undefined> {
    const rows = await db()
      .select()
      .from(payees)
      .where(and(eq(payees.id, id), isNull(payees.deletedAt)))
      .limit(1);
    return rows[0] ? rowToPayee(rows[0]) : undefined;
  },

  async create(payee: Payee, w9Doc?: { dataUrl: string; filename: string }): Promise<Payee> {
    let url = payee.w9DocUrl;
    // Uploading a W-9 document implies it is on file — keep both backends identical.
    const onFile = payee.w9OnFile || Boolean(w9Doc?.dataUrl);
    if (w9Doc?.dataUrl) {
      url = await maybeUploadToBlob(
        { dataUrl: w9Doc.dataUrl, filename: w9Doc.filename },
        `w9/${payee.contractorId}`
      );
    }
    await db().insert(payees).values({
      id: payee.id,
      contractorId: payee.contractorId,
      name: payee.name,
      payeeType: payee.payeeType,
      legalName: payee.legalName ?? null,
      address: payee.address ?? null,
      tinType: payee.tinType,
      tinLast4: payee.tinLast4 ?? null,
      w9OnFile: onFile ? "true" : "false",
      w9ReceivedOn: payee.w9ReceivedOn ?? (onFile ? new Date().toISOString().slice(0, 10) : null),
      w9DocUrl: url ?? null,
      w9DocFilename: w9Doc?.filename ?? payee.w9DocFilename ?? null,
      email: payee.email,
      phone: payee.phone,
      notes: payee.notes,
      createdAt: payee.createdAt,
      updatedAt: payee.updatedAt,
    });
    return { ...payee, w9OnFile: onFile, w9DocUrl: url, w9DocFilename: w9Doc?.filename ?? payee.w9DocFilename };
  },

  async update(
    id: string,
    patch: Partial<Omit<Payee, "id" | "contractorId" | "createdAt" | "updatedAt">>,
    w9Doc?: { dataUrl: string; filename: string }
  ): Promise<Payee | undefined> {
    const existing = await this.get(id);
    if (!existing) return undefined;
    const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (patch.name !== undefined) set.name = patch.name;
    if (patch.payeeType !== undefined) set.payeeType = patch.payeeType;
    if (patch.legalName !== undefined) set.legalName = patch.legalName ?? null;
    if (patch.address !== undefined) set.address = patch.address ?? null;
    if (patch.tinType !== undefined) set.tinType = patch.tinType;
    if (patch.tinLast4 !== undefined) set.tinLast4 = patch.tinLast4 ?? null;
    if (patch.w9OnFile !== undefined) set.w9OnFile = patch.w9OnFile ? "true" : "false";
    if (patch.w9ReceivedOn !== undefined) set.w9ReceivedOn = patch.w9ReceivedOn ?? null;
    if (patch.email !== undefined) set.email = patch.email;
    if (patch.phone !== undefined) set.phone = patch.phone;
    if (patch.notes !== undefined) set.notes = patch.notes;
    if (w9Doc?.dataUrl) {
      set.w9DocUrl = await maybeUploadToBlob(
        { dataUrl: w9Doc.dataUrl, filename: w9Doc.filename },
        `w9/${existing.contractorId}`
      );
      set.w9DocFilename = w9Doc.filename;
      set.w9OnFile = "true";
    }
    await db().update(payees).set(set).where(eq(payees.id, id));
    return this.get(id);
  },

  async softDelete(id: string): Promise<boolean> {
    const existing = await this.get(id);
    if (!existing) return false;
    await db()
      .update(payees)
      .set({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(eq(payees.id, id));
    return true;
  },
};

export const pgForm1099Store = {
  async list(contractorId: string, taxYear?: number): Promise<Form1099Received[]> {
    const filters = [eq(forms1099Received.contractorId, contractorId), isNull(forms1099Received.deletedAt)];
    if (taxYear) filters.push(eq(forms1099Received.taxYear, taxYear));
    const rows = await db()
      .select()
      .from(forms1099Received)
      .where(and(...filters))
      .orderBy(forms1099Received.issuerName);
    return rows.map(rowToForm1099);
  },

  async get(id: string): Promise<Form1099Received | undefined> {
    const rows = await db()
      .select()
      .from(forms1099Received)
      .where(and(eq(forms1099Received.id, id), isNull(forms1099Received.deletedAt)))
      .limit(1);
    return rows[0] ? rowToForm1099(rows[0]) : undefined;
  },

  async create(form: Form1099Received, doc?: { dataUrl: string; filename: string }): Promise<Form1099Received> {
    let url = form.docUrl;
    if (doc?.dataUrl) {
      url = await maybeUploadToBlob({ dataUrl: doc.dataUrl, filename: doc.filename }, `forms1099/${form.contractorId}`);
    }
    await db().insert(forms1099Received).values({
      id: form.id,
      contractorId: form.contractorId,
      taxYear: form.taxYear,
      issuerName: form.issuerName,
      formType: form.formType,
      amountCents: form.amountCents,
      docUrl: url ?? null,
      docFilename: doc?.filename ?? form.docFilename ?? null,
      notes: form.notes,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    });
    return { ...form, docUrl: url, docFilename: doc?.filename ?? form.docFilename };
  },

  async update(
    id: string,
    patch: Partial<Pick<Form1099Received, "taxYear" | "issuerName" | "formType" | "amountCents" | "notes">>
  ): Promise<Form1099Received | undefined> {
    const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (patch.taxYear !== undefined) set.taxYear = patch.taxYear;
    if (patch.issuerName !== undefined) set.issuerName = patch.issuerName;
    if (patch.formType !== undefined) set.formType = patch.formType;
    if (patch.amountCents !== undefined) set.amountCents = patch.amountCents;
    if (patch.notes !== undefined) set.notes = patch.notes;
    await db().update(forms1099Received).set(set).where(eq(forms1099Received.id, id));
    return this.get(id);
  },

  async softDelete(id: string): Promise<boolean> {
    const existing = await this.get(id);
    if (!existing) return false;
    await db()
      .update(forms1099Received)
      .set({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(eq(forms1099Received.id, id));
    return true;
  },
};

// --- Delivery 3: tax set-asides ---------------------------------------------

type SetAsideRow = typeof taxSetAsides.$inferSelect;

function rowToSetAside(row: SetAsideRow): TaxSetAside {
  return {
    id: row.id,
    contractorId: row.contractorId,
    taxYear: row.taxYear,
    quarter: row.quarter,
    amountCents: row.amountCents,
    movedOn: row.movedOn,
    note: row.note,
    createdAt: row.createdAt,
  };
}

export const pgSetAsideStore = {
  async list(contractorId: string, taxYear?: number): Promise<TaxSetAside[]> {
    const filters = [eq(taxSetAsides.contractorId, contractorId), isNull(taxSetAsides.deletedAt)];
    if (taxYear) filters.push(eq(taxSetAsides.taxYear, taxYear));
    const rows = await db()
      .select()
      .from(taxSetAsides)
      .where(and(...filters))
      .orderBy(sql`${taxSetAsides.movedOn} DESC`);
    return rows.map(rowToSetAside);
  },
  async get(id: string): Promise<TaxSetAside | undefined> {
    const rows = await db()
      .select()
      .from(taxSetAsides)
      .where(and(eq(taxSetAsides.id, id), isNull(taxSetAsides.deletedAt)))
      .limit(1);
    return rows[0] ? rowToSetAside(rows[0]) : undefined;
  },
  async create(entry: TaxSetAside): Promise<TaxSetAside> {
    await db().insert(taxSetAsides).values({
      id: entry.id,
      contractorId: entry.contractorId,
      taxYear: entry.taxYear,
      quarter: entry.quarter,
      amountCents: entry.amountCents,
      movedOn: entry.movedOn,
      note: entry.note,
      createdAt: entry.createdAt,
    });
    return entry;
  },
  async softDelete(id: string): Promise<boolean> {
    const existing = await this.get(id);
    if (!existing) return false;
    await db()
      .update(taxSetAsides)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(taxSetAsides.id, id));
    return true;
  },
};
