import { NextRequest, NextResponse } from "next/server";
import { expenseStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { toCents, isIsoDate } from "@/lib/money";
import type { Expense } from "@/lib/money-types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await expenseStore.get(id);
  if (!existing) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, existing.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const body = await req.json();
  const patch: Partial<
    Pick<Expense, "categoryId" | "amountCents" | "spentOn" | "vendor" | "note" | "billedToClient" | "leadId" | "payeeId">
  > = {};

  if (body.amount !== undefined) {
    const cents = toCents(body.amount);
    if (cents <= 0) return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    patch.amountCents = cents;
  }
  if (body.spentOn !== undefined) {
    if (!isIsoDate(String(body.spentOn))) {
      return NextResponse.json({ error: "Date must be YYYY-MM-DD" }, { status: 400 });
    }
    patch.spentOn = String(body.spentOn);
  }
  if (body.categoryId !== undefined) patch.categoryId = String(body.categoryId);
  if (body.vendor !== undefined) patch.vendor = String(body.vendor).slice(0, 120);
  if (body.note !== undefined) patch.note = String(body.note).slice(0, 300);
  if (body.billedToClient !== undefined) patch.billedToClient = Boolean(body.billedToClient);
  if ("leadId" in body) patch.leadId = body.leadId ? String(body.leadId) : undefined;
  if ("payeeId" in body) patch.payeeId = body.payeeId ? String(body.payeeId) : undefined;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await expenseStore.update(id, patch);
  return NextResponse.json({ ok: true, expense: updated });
}

/** Soft delete only — the row is retained so a tax year can be reconstructed. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await expenseStore.get(id);
  if (!existing) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, existing.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  await expenseStore.softDelete(id);
  return NextResponse.json({ ok: true });
}
