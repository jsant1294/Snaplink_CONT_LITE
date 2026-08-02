import { NextRequest, NextResponse } from "next/server";
import { intakeSessionStore } from "@/lib/store";
import { isOperatorRequest } from "@/lib/professional-intake/auth";
import { isValidManualPaymentStatus, setManualPaymentStatus } from "@/lib/professional-intake-payment/manual-override";
import { getProfessionalBillingSummary } from "@/lib/professional-intake-payment/adapters";

/**
 * PATCH { status, note?, setBy? } — manual payment/comp override, operator
 * only. Internal administrative record only — never calls Stripe or the
 * reused real-estate billing engine. `status: null` clears the override.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isOperatorRequest(req)) return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  const { id } = await params;
  const session = await intakeSessionStore.get(id);
  if (!session) return NextResponse.json({ error: "Intake session not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const status = body.status === null ? null : body.status;
  if (status !== null && !isValidManualPaymentStatus(status)) {
    return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
  }
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : undefined;
  const setBy = typeof body.setBy === "string" && body.setBy.trim() ? body.setBy.trim().slice(0, 120) : "operator";
  if (!(await setManualPaymentStatus(session.ownerType, session.ownerId, status, note, setBy))) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, billing: await getProfessionalBillingSummary(session) });
}
