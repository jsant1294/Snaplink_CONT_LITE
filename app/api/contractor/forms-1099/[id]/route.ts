import { NextRequest, NextResponse } from "next/server";
import { form1099Store } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { toCents } from "@/lib/money";
import { FORM_1099_TYPES, type Form1099Received, type Form1099Type } from "@/lib/money-types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await form1099Store.get(id);
  if (!existing) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, existing.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const body = await req.json();
  const patch: Partial<Pick<Form1099Received, "taxYear" | "issuerName" | "formType" | "amountCents" | "notes">> = {};

  if (body.amount !== undefined) {
    const cents = toCents(body.amount);
    if (cents <= 0) return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    patch.amountCents = cents;
  }
  if (body.issuerName !== undefined) {
    const n = String(body.issuerName).trim();
    if (!n) return NextResponse.json({ error: "Who issued it is required" }, { status: 400 });
    patch.issuerName = n.slice(0, 160);
  }
  if (body.formType !== undefined && FORM_1099_TYPES.includes(body.formType)) {
    patch.formType = body.formType as Form1099Type;
  }
  if (body.taxYear !== undefined) {
    const y = Number(body.taxYear);
    const nowYear = new Date().getFullYear();
    if (!Number.isInteger(y) || y < nowYear - 10 || y > nowYear + 1) {
      return NextResponse.json({ error: "Tax year is out of range" }, { status: 400 });
    }
    patch.taxYear = y;
  }
  if (body.notes !== undefined) patch.notes = String(body.notes).slice(0, 400);

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await form1099Store.update(id, patch);
  return NextResponse.json({ ok: true, form: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await form1099Store.get(id);
  if (!existing) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, existing.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  await form1099Store.softDelete(id);
  return NextResponse.json({ ok: true });
}
