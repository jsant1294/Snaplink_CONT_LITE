import { NextRequest, NextResponse } from "next/server";
import { contractorStore } from "@/lib/store";
import { canAccessContractor } from "@/lib/auth";
import { isModuleEnabled } from "@/lib/entitlements";
import { getStripe, stripeEnabled } from "@/lib/stripe/config";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/** Stripe redirects here when the onboarding link itself has expired — mint a fresh one. */
export async function GET(req: NextRequest) {
  const contractorId = req.nextUrl.searchParams.get("contractorId") ?? "";
  const pin = req.nextUrl.searchParams.get("pin") ?? "";
  const contractor = await contractorStore.getById(contractorId);
  const moduleEnabled = contractor ? await isModuleEnabled(contractorId, "invoices") : false;
  if (!contractor || !canAccessContractor(pin, contractor) || !stripeEnabled() || !contractor.stripeAccountId || !moduleEnabled) {
    return NextResponse.redirect(`${APP_URL}/contractor-admin/${contractor?.username ?? ""}/invoices`);
  }
  const stripe = await getStripe();
  const base = `${APP_URL}/api/contractor/invoices/connect`;
  const qs = `contractorId=${encodeURIComponent(contractorId)}&pin=${encodeURIComponent(pin)}`;
  const link = await stripe.accountLinks.create({
    account: contractor.stripeAccountId,
    type: "account_onboarding",
    refresh_url: `${base}/refresh?${qs}`,
    return_url: `${base}/return?${qs}`,
  });
  return NextResponse.redirect(link.url);
}
