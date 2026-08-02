import { NextRequest, NextResponse } from "next/server";
import { intakeSessionStore } from "@/lib/store";
import { isOperatorRequest } from "@/lib/professional-intake/auth";

function operatorLabel(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 120) : "operator";
}

/**
 * POST/DELETE — content approval, distinct from applying intake fields
 * (see docs/professional-intake-payment/04-approve-save-publish.md). Only
 * requires the session to already be applied — the operator has reviewed
 * the actual profile fields, not just the intake preview, before approving.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isOperatorRequest(req)) return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  const { id } = await params;
  const session = await intakeSessionStore.get(id);
  if (!session) return NextResponse.json({ error: "Intake session not found" }, { status: 404 });
  if (session.status !== "applied") return NextResponse.json({ error: "Apply the reviewed intake before approving its content" }, { status: 409 });
  const body = await req.json().catch(() => ({}));
  const updated = await intakeSessionStore.update(id, {
    contentApprovedAt: new Date().toISOString(),
    contentApprovedBy: operatorLabel(body.approvedBy),
  });
  return NextResponse.json({ ok: true, session: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isOperatorRequest(req)) return NextResponse.json({ error: "Operator PIN required" }, { status: 401 });
  const { id } = await params;
  if (!(await intakeSessionStore.get(id))) return NextResponse.json({ error: "Intake session not found" }, { status: 404 });
  const updated = await intakeSessionStore.update(id, { contentApprovedAt: null, contentApprovedBy: null });
  return NextResponse.json({ ok: true, session: updated });
}
