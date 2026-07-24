import { NextRequest, NextResponse } from "next/server";
import { expenseStore, categoryStore, contractorStore, newId } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { toCents, isIsoDate, todayIso } from "@/lib/money";
import type { Expense } from "@/lib/money-types";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("contractor") ?? "";
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const yearParam = req.nextUrl.searchParams.get("year");
  const leadParam = req.nextUrl.searchParams.get("leadId");
  const opts: { year?: number; leadId?: string | null } = {};
  if (yearParam) opts.year = Number(yearParam);
  if (leadParam !== null) opts.leadId = leadParam === "null" ? null : leadParam;

  const expenses = await expenseStore.list(contractor.id, opts);
  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contractor = await contractorStore.getByUsername(String(body.contractorUsername ?? ""));
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const amountCents = toCents(body.amount);
  if (amountCents <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
  }

  const categories = await categoryStore.list(contractor.id);
  const category = categories.find((c) => c.id === String(body.categoryId ?? ""));
  if (!category) return NextResponse.json({ error: "Unknown category" }, { status: 400 });

  const spentOn = String(body.spentOn ?? "") || todayIso();
  if (!isIsoDate(spentOn)) {
    return NextResponse.json({ error: "Date must be YYYY-MM-DD" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const expense: Expense = {
    id: newId("exp"),
    contractorId: contractor.id,
    leadId: body.leadId ? String(body.leadId) : undefined,
    payeeId: body.payeeId ? String(body.payeeId) : undefined,
    categoryId: category.id,
    amountCents,
    spentOn,
    vendor: String(body.vendor ?? "").slice(0, 120),
    note: String(body.note ?? "").slice(0, 300),
    billedToClient: false,
    createdAt: now,
    updatedAt: now,
  };

  const receipt =
    body.receipt && body.receipt.dataUrl
      ? { dataUrl: String(body.receipt.dataUrl), filename: String(body.receipt.filename ?? "receipt.jpg") }
      : undefined;

  const created = await expenseStore.create(expense, receipt);
  return NextResponse.json({ ok: true, expense: created });
}
