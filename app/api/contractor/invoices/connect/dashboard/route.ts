import { NextRequest, NextResponse } from "next/server";
import { contractorStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { requireModuleEnabled } from "@/lib/entitlements";
import { getStripe, stripeEnabled } from "@/lib/stripe/config";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const contractorId = String(body.contractorId ?? "");
  if (!contractorId) return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  const denied = await authorizeContractorId(req, contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(contractorId, "invoices");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });
  const contractor = await contractorStore.getById(contractorId);
  if (!stripeEnabled() || !contractor?.stripeAccountId) return NextResponse.json({ error: "Stripe account is not connected" }, { status: 400 });
  try {
    const stripe = await getStripe();
    const link = await stripe.accounts.createLoginLink(contractor.stripeAccountId);
    return NextResponse.json({ ok: true, url: link.url });
  } catch {
    return NextResponse.json({ error: "Stripe Dashboard is temporarily unavailable" }, { status: 502 });
  }
}
