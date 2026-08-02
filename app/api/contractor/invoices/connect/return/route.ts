import { NextRequest, NextResponse } from "next/server";
import { contractorStore } from "@/lib/store";
import { getStripe, stripeEnabled } from "@/lib/stripe/config";
import { verifyStripeConnectState } from "@/lib/stripe/connect-state";
import { readinessPatchFromAccount } from "@/lib/stripe/connect-readiness";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/** Stripe redirects here after the contractor finishes (or exits) onboarding. */
export async function GET(req: NextRequest) {
  const state = verifyStripeConnectState(req.nextUrl.searchParams.get("state") ?? "");
  if (!state || !stripeEnabled()) return NextResponse.redirect(`${APP_URL}/contractor-admin?stripe_status=invalid`);
  const contractor = await contractorStore.getById(state.contractorId);
  if (!contractor || !contractor.stripeAccountId) return NextResponse.redirect(`${APP_URL}/contractor-admin?stripe_status=invalid`);
  const stripe = await getStripe();
  const account = await stripe.accounts.retrieve(contractor.stripeAccountId);
  const patch = readinessPatchFromAccount(account);
  await contractorStore.update(contractor.id, patch);
  return NextResponse.redirect(`${APP_URL}${state.destination}?stripe_status=${patch.stripeConnectStatus}`);
}
