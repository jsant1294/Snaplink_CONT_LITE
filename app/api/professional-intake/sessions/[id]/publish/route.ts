import { NextRequest, NextResponse } from "next/server";
import { intakeSessionStore, contractorStore } from "@/lib/store";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { isOperatorRequest } from "@/lib/professional-intake/auth";
import { getProfessionalBillingSummary } from "@/lib/professional-intake-payment/adapters";
import { evaluateProfilePublicationEligibility } from "@/lib/professional-intake-payment/eligibility";

/**
 * POST — publishes the profile, operator only. Enforces the shared
 * eligibility rule server-side (never relies only on a disabled UI button).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isOperatorRequest(req)) return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  const { id } = await params;
  const session = await intakeSessionStore.get(id);
  if (!session) return NextResponse.json({ error: "Intake session not found" }, { status: 404 });
  if (session.status !== "applied") return NextResponse.json({ error: "Apply the intake before publishing" }, { status: 409 });
  const billing = await getProfessionalBillingSummary(session);
  if (!billing) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const eligibility = evaluateProfilePublicationEligibility(
    {
      profileApproved: Boolean(session.contentApprovedAt),
      paymentStatus: billing.paymentStatus,
      planActive: billing.planActive,
      entitlementValid: billing.entitlementValid,
    },
    session.locale === "es" ? "es" : "en"
  );
  if (!eligibility.canPublish) return NextResponse.json({ error: "Profile is not eligible to publish", eligibility, billing }, { status: 409 });

  // Contractors: transition the lifecycle to `published` so the profile becomes
  // publicly discoverable (isPublicContractor requires status === "published").
  if (session.ownerType === "contractor") {
    const contractor = await contractorStore.update(session.ownerId, { status: "published" });
    if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    return NextResponse.json({ ok: true, published: true, publicationMode: "contractor_status_published", eligibility, billing });
  }
  const profile = await agentProfileStore.update(session.ownerId, {
    snaplinkStatus: "published",
    southlineStatus: "published",
    onboardingStatus: "launched",
  });
  if (!profile) return NextResponse.json({ error: "Agent profile not found" }, { status: 404 });
  return NextResponse.json({ ok: true, published: true, profile, eligibility, billing });
}
