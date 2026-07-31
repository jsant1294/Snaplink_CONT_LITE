// ---------------------------------------------------------------------------
// Invoices — Stripe Connect-backed. Stripe hosts the actual pay page/PDF;
// this table is a local mirror for listing + status. See lib/stripe/config.ts
// for the enable/disable gate. See lib/db/schema.ts for the Postgres shape.
// ---------------------------------------------------------------------------

export type InvoiceStatus = "draft" | "open" | "paid" | "uncollectible" | "void";

export interface Invoice {
  id: string;
  contractorId: string;
  leadId?: string;
  publicToken: string;
  providerInvoiceId?: string;
  hostedInvoiceUrl?: string;
  invoicePdfUrl?: string;
  clientName: string;
  clientEmail: string;
  amountCents: number;
  status: InvoiceStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
}
