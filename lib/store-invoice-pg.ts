// ---------------------------------------------------------------------------
// Invoices — Postgres store. Same shape and conventions as
// lib/store-campaign-pg.ts.
// ---------------------------------------------------------------------------

import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, desc } from "drizzle-orm";
import { invoices } from "./db/schema";
import type { Invoice, InvoiceStatus } from "./invoice-types";
import { databaseUrl, sslConfig } from "./db-url";

let _db: NodePgDatabase | null = null;

function db(): NodePgDatabase {
  if (!_db) {
    const pool = new Pool({ connectionString: databaseUrl, ssl: sslConfig, max: 5 });
    _db = drizzle(pool);
  }
  return _db;
}

type InvoiceRow = typeof invoices.$inferSelect;

function rowToInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    contractorId: row.contractorId,
    leadId: row.leadId ?? undefined,
    publicToken: row.publicToken,
    providerInvoiceId: row.providerInvoiceId ?? undefined,
    hostedInvoiceUrl: row.hostedInvoiceUrl ?? undefined,
    invoicePdfUrl: row.invoicePdfUrl ?? undefined,
    clientName: row.clientName,
    clientEmail: row.clientEmail,
    amountCents: row.amountCents,
    status: row.status as InvoiceStatus,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const pgInvoiceStore = {
  async list(contractorId: string): Promise<Invoice[]> {
    const rows = await db()
      .select()
      .from(invoices)
      .where(eq(invoices.contractorId, contractorId))
      .orderBy(desc(invoices.createdAt));
    return rows.map(rowToInvoice);
  },

  async get(id: string): Promise<Invoice | undefined> {
    const rows = await db().select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return rows[0] ? rowToInvoice(rows[0]) : undefined;
  },

  async getByToken(token: string): Promise<Invoice | undefined> {
    const rows = await db().select().from(invoices).where(eq(invoices.publicToken, token)).limit(1);
    return rows[0] ? rowToInvoice(rows[0]) : undefined;
  },

  async create(invoice: Invoice): Promise<Invoice> {
    await db().insert(invoices).values({
      id: invoice.id,
      contractorId: invoice.contractorId,
      leadId: invoice.leadId ?? null,
      publicToken: invoice.publicToken,
      providerInvoiceId: invoice.providerInvoiceId ?? null,
      hostedInvoiceUrl: invoice.hostedInvoiceUrl ?? null,
      invoicePdfUrl: invoice.invoicePdfUrl ?? null,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      amountCents: invoice.amountCents,
      status: invoice.status,
      description: invoice.description,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    });
    return invoice;
  },

  async setStripeDetails(
    id: string,
    patch: { providerInvoiceId: string; hostedInvoiceUrl?: string; invoicePdfUrl?: string; status: InvoiceStatus }
  ): Promise<Invoice | undefined> {
    await db()
      .update(invoices)
      .set({
        providerInvoiceId: patch.providerInvoiceId,
        hostedInvoiceUrl: patch.hostedInvoiceUrl ?? null,
        invoicePdfUrl: patch.invoicePdfUrl ?? null,
        status: patch.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(invoices.id, id));
    return this.get(id);
  },

  async setStatusByProviderId(providerInvoiceId: string, status: InvoiceStatus): Promise<Invoice | undefined> {
    const rows = await db().select().from(invoices).where(eq(invoices.providerInvoiceId, providerInvoiceId)).limit(1);
    if (!rows[0]) return undefined;
    await db()
      .update(invoices)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(invoices.id, rows[0].id));
    return this.get(rows[0].id);
  },
};
