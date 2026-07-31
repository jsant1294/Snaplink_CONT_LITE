import { NextRequest, NextResponse } from "next/server";
import { contractorStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { stripeEnabled } from "@/lib/stripe/config";

export async function GET(req: NextRequest) {
  const contractorId = req.nextUrl.searchParams.get("contractorId") ?? "";
  if (!contractorId) return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  const denied = await authorizeContractorId(req, contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const enabled = stripeEnabled();
  if (!enabled) {
    return NextResponse.json({ stripeEnabled: false, connected: false, onboardingComplete: false });
  }
  const contractor = await contractorStore.getById(contractorId);
  return NextResponse.json({
    stripeEnabled: true,
    connected: Boolean(contractor?.stripeAccountId),
    onboardingComplete: Boolean(contractor?.stripeOnboardingComplete),
  });
}
