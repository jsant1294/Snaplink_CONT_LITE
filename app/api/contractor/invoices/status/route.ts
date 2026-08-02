import { NextRequest, NextResponse } from "next/server";
import { contractorStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { requireModuleEnabled } from "@/lib/entitlements";
import { stripeDiagnostics } from "@/lib/stripe/config";
import { deriveStripeConnectStatus } from "@/lib/stripe/connect-readiness";

export async function GET(req: NextRequest) {
  const contractorId = req.nextUrl.searchParams.get("contractorId") ?? "";
  if (!contractorId) return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  const denied = await authorizeContractorId(req, contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(contractorId, "invoices");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });

  const diagnostics = stripeDiagnostics();
  if (!diagnostics.enabled) {
    return NextResponse.json({ stripeEnabled: false, connected: false, status: "not_connected", diagnostics });
  }
  const contractor = await contractorStore.getById(contractorId);
  const status = contractor?.stripeConnectStatus ?? deriveStripeConnectStatus({ connected: Boolean(contractor?.stripeAccountId), detailsSubmitted: Boolean(contractor?.stripeDetailsSubmitted), chargesEnabled: Boolean(contractor?.stripeChargesEnabled), payoutsEnabled: Boolean(contractor?.stripePayoutsEnabled), requirementsCurrentlyDue: contractor?.stripeRequirementsCurrentlyDue, disabledReason: contractor?.stripeDisabledReason });
  return NextResponse.json({
    stripeEnabled: true,
    connected: Boolean(contractor?.stripeAccountId),
    onboardingComplete: status === "ready",
    status,
    chargesEnabled: Boolean(contractor?.stripeChargesEnabled),
    payoutsEnabled: Boolean(contractor?.stripePayoutsEnabled),
    requirementsDueCount: contractor?.stripeRequirementsCurrentlyDue?.length ?? 0,
    lastSyncedAt: contractor?.stripeLastSyncedAt ?? null,
    diagnostics,
  });
}
