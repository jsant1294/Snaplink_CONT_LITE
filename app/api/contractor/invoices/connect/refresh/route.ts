import { NextRequest, NextResponse } from "next/server";
import { contractorStore } from "@/lib/store";
import { isModuleEnabled } from "@/lib/entitlements";
import { getStripe, stripeEnabled } from "@/lib/stripe/config";
import { createStripeConnectState, verifyStripeConnectState } from "@/lib/stripe/connect-state";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/** Stripe redirects here when the onboarding link itself has expired — mint a fresh one. */
export async function GET(req: NextRequest) {
  const currentState = verifyStripeConnectState(req.nextUrl.searchParams.get("state") ?? "");
  if (!currentState || !stripeEnabled()) return NextResponse.redirect(`${APP_URL}/contractor-admin?stripe_status=invalid`);
  const contractor = await contractorStore.getById(currentState.contractorId);
  const moduleEnabled = contractor ? await isModuleEnabled(contractor.id, "invoices") : false;
  if (!contractor || !contractor.stripeAccountId || !moduleEnabled) return NextResponse.redirect(`${APP_URL}/contractor-admin?stripe_status=invalid`);
  const stripe = await getStripe();
  const base = `${APP_URL}/api/contractor/invoices/connect`;
  const renewedState = createStripeConnectState(contractor.id, currentState.destination);
  const qs = `state=${encodeURIComponent(renewedState)}`;
  const link = await stripe.accountLinks.create({
    account: contractor.stripeAccountId,
    type: "account_onboarding",
    refresh_url: `${base}/refresh?${qs}`,
    return_url: `${base}/return?${qs}`,
  });
  return NextResponse.redirect(link.url);
}
