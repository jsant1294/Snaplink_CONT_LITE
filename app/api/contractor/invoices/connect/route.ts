import { NextRequest, NextResponse } from "next/server";
import { contractorStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { requireModuleEnabled } from "@/lib/entitlements";
import { getStripe, stripeEnabled } from "@/lib/stripe/config";
import { contractorInvoicesDestination, createStripeConnectState } from "@/lib/stripe/connect-state";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

function buildLinkUrls(state: string) {
  const base = `${APP_URL}/api/contractor/invoices/connect`;
  const qs = `state=${encodeURIComponent(state)}`;
  return { refresh_url: `${base}/refresh?${qs}`, return_url: `${base}/return?${qs}` };
}

export async function POST(req: NextRequest) {
  if (!stripeEnabled()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const body = await req.json();
  const contractorId = String(body.contractorId ?? "");
  if (!contractorId) return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  const denied = await authorizeContractorId(req, contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(contractorId, "invoices");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });

  const contractor = await contractorStore.getById(contractorId);
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });

  const stripe = await getStripe();
  let accountId = contractor.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: contractor.email || undefined,
      business_type: "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await contractorStore.update(contractorId, { stripeAccountId: accountId });
  }

  let state: string;
  try { state = createStripeConnectState(contractorId, contractorInvoicesDestination(contractor.username)); }
  catch { return NextResponse.json({ error: "Stripe Connect state signing is not configured" }, { status: 503 }); }
  const { refresh_url, return_url } = buildLinkUrls(state);
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url,
    return_url,
  });

  return NextResponse.json({ ok: true, url: link.url });
}
