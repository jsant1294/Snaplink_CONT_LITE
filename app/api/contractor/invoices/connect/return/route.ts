import { NextRequest, NextResponse } from "next/server";
import { contractorStore } from "@/lib/store";
import { canAccessContractor } from "@/lib/auth";
import { getStripe, stripeEnabled } from "@/lib/stripe/config";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/** Stripe redirects here after the contractor finishes (or exits) onboarding. */
export async function GET(req: NextRequest) {
  const contractorId = req.nextUrl.searchParams.get("contractorId") ?? "";
  const pin = req.nextUrl.searchParams.get("pin") ?? "";
  const contractor = await contractorStore.getById(contractorId);
  const dest = `${APP_URL}/contractor-admin/${contractor?.username ?? ""}/invoices`;
  if (!contractor || !canAccessContractor(pin, contractor) || !stripeEnabled() || !contractor.stripeAccountId) {
    return NextResponse.redirect(dest);
  }
  const stripe = await getStripe();
  const account = await stripe.accounts.retrieve(contractor.stripeAccountId);
  await contractorStore.update(contractorId, { stripeOnboardingComplete: Boolean(account.details_submitted) });
  return NextResponse.redirect(dest);
}
