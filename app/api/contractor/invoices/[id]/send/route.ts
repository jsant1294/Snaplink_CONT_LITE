import { NextRequest, NextResponse } from "next/server";
import { contractorStore, invoiceStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { requireModuleEnabled } from "@/lib/entitlements";
import { getStripe, stripeEnabled } from "@/lib/stripe/config";
import type { InvoiceStatus } from "@/lib/invoice-types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!stripeEnabled()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const { id } = await params;
  const invoice = await invoiceStore.get(id);
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, invoice.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(invoice.contractorId, "invoices");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });

  const contractor = await contractorStore.getById(invoice.contractorId);
  if (!contractor?.stripeAccountId || contractor.stripeConnectStatus !== "ready" || !contractor.stripeDetailsSubmitted || !contractor.stripeChargesEnabled || !contractor.stripePayoutsEnabled) {
    return NextResponse.json({ error: "Connect Stripe and finish onboarding before sending invoices" }, { status: 400 });
  }
  if (invoice.providerInvoiceId) {
    return NextResponse.json({ error: "Invoice was already sent" }, { status: 400 });
  }

  const stripe = await getStripe();
  const opts = { stripeAccount: contractor.stripeAccountId };

  const existingCustomers = await stripe.customers.list({ email: invoice.clientEmail, limit: 1 }, opts);
  const customer =
    existingCustomers.data[0] ??
    (await stripe.customers.create({ email: invoice.clientEmail, name: invoice.clientName || undefined }, opts));

  await stripe.invoiceItems.create(
    { customer: customer.id, amount: invoice.amountCents, currency: "usd", description: invoice.description || undefined },
    opts
  );
  const draft = await stripe.invoices.create({ customer: customer.id, auto_advance: false, collection_method: "send_invoice", days_until_due: 7 }, opts);
  const finalized = await stripe.invoices.finalizeInvoice(draft.id!, undefined, opts);
  const sent = await stripe.invoices.sendInvoice(draft.id!, undefined, opts);

  const updated = await invoiceStore.setStripeDetails(id, {
    providerInvoiceId: sent.id!,
    hostedInvoiceUrl: sent.hosted_invoice_url ?? finalized.hosted_invoice_url ?? undefined,
    invoicePdfUrl: sent.invoice_pdf ?? finalized.invoice_pdf ?? undefined,
    status: (sent.status ?? "open") as InvoiceStatus,
  });

  return NextResponse.json({ ok: true, invoice: updated });
}
