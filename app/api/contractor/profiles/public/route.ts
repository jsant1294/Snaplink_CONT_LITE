import { NextResponse } from "next/server";
import { contractorStore } from "@/lib/store";
import { isPublicContractor } from "@/lib/southline-search";
import { publicContractorDiscovery } from "@/lib/auth";

/**
 * PUBLIC contractor discovery projection. Unlike GET /api/contractor/profiles
 * (operator-only), this endpoint requires NO authentication and returns only
 * the fields needed for public contractor discovery (directory, results,
 * planner, booking). See PublicContractorDiscovery in lib/auth.ts for the
 * exact allow-list. Private/internal fields (pin, payments, all Stripe/Connect
 * and manual-payment state, internal owner record) are never returned.
 */
export async function GET() {
  const contractors = (await contractorStore.list()).filter((c) => isPublicContractor(c));
  return NextResponse.json({ contractors: contractors.map(publicContractorDiscovery) });
}
