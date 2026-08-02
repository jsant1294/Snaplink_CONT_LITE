import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { processedWebhookEvents } from "@/lib/db/schema";
import { contractorStore, invoiceStore } from "@/lib/store";
import { getStripe, stripeEnabled, stripeWebhookSecret } from "@/lib/stripe/config";
import { databaseUrl, sslConfig } from "@/lib/db-url";
import type { InvoiceStatus } from "@/lib/invoice-types";
import type Stripe from "stripe";
import { readinessPatchFromAccount } from "@/lib/stripe/connect-readiness";

const INVOICE_EVENT_TYPES = new Set([
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.finalized",
  "invoice.voided",
  "invoice.marked_uncollectible",
]);

export async function POST(req: NextRequest) {
  if (!stripeEnabled()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const secret = stripeWebhookSecret();
  if (!secret) return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 503 });

  const raw = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const stripe = await getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: databaseUrl, ssl: sslConfig, max: 1 });
  const db = drizzle(pool);
  const already = await db
    .select()
    .from(processedWebhookEvents)
    .where(eq(processedWebhookEvents.id, event.id))
    .limit(1);
  if (already.length > 0) {
    await pool.end();
    return NextResponse.json({ ok: true, deduped: true });
  }

  let recordedEventType: string = event.type;
  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    const contractor = await contractorStore.getByStripeAccountId(account.id);
    if (contractor) await contractorStore.update(contractor.id, readinessPatchFromAccount(account));
    else recordedEventType = "account.updated.unknown_account";
  } else if (INVOICE_EVENT_TYPES.has(event.type)) {
    const invoice = event.data.object as Stripe.Invoice;
    if (invoice.id) {
      await invoiceStore.setStatusByProviderId(invoice.id, (invoice.status ?? "open") as InvoiceStatus);
    }
  }

  await db.insert(processedWebhookEvents).values({ id: event.id, eventType: recordedEventType });
  await pool.end();
  return NextResponse.json({ ok: true });
}
