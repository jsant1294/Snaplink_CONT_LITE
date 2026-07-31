import { NextRequest, NextResponse } from "next/server";
import { contractorStore, leadStore, expenseStore, categoryStore, taxProfileStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { requireModuleEnabled } from "@/lib/entitlements";
import { buildMoneySummary } from "@/lib/money-summary";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("contractor") ?? "";
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(contractor.id, "money");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });

  const year = Number(req.nextUrl.searchParams.get("year")) || new Date().getFullYear();

  const [leads, expenses, categories, profile] = await Promise.all([
    leadStore.list(contractor.username),
    expenseStore.list(contractor.id, { year }),
    categoryStore.list(contractor.id),
    taxProfileStore.get(contractor.id),
  ]);

  const summary = buildMoneySummary({
    year,
    setAsidePercent: profile?.setAsidePercent ?? 25,
    leads,
    expenses,
    categories,
  });

  return NextResponse.json({ summary });
}
