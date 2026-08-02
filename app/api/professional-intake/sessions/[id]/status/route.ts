import { NextRequest, NextResponse } from "next/server";
import { intakeSessionStore } from "@/lib/store";
import { isOperatorRequest } from "@/lib/professional-intake/auth";
import { getProfessionalBillingSummary } from "@/lib/professional-intake-payment/adapters";
import { evaluateProfilePublicationEligibility } from "@/lib/professional-intake-payment/eligibility";

/** GET — the intake review summary: session + billing + derived publication eligibility, in one call. Operator only. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isOperatorRequest(req)) return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  const { id } = await params;
  const session = await intakeSessionStore.get(id);
  if (!session) return NextResponse.json({ error: "Intake session not found" }, { status: 404 });
  const billing = await getProfessionalBillingSummary(session);
  if (!billing) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const lang = session.locale === "es" ? "es" : "en";
  const eligibility = evaluateProfilePublicationEligibility(
    {
      profileApproved: Boolean(session.contentApprovedAt),
      paymentStatus: billing.paymentStatus,
      planActive: billing.planActive,
      entitlementValid: billing.entitlementValid,
    },
    lang
  );
  return NextResponse.json({ ok: true, session, billing, eligibility });
}
