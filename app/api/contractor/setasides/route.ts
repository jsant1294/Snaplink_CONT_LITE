import { NextRequest, NextResponse } from "next/server";
import { setAsideStore, contractorStore, newId } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { requireModuleEnabled } from "@/lib/entitlements";
import { toCents, isIsoDate, todayIso } from "@/lib/money";
import type { TaxSetAside } from "@/lib/money-types";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("contractor") ?? "";
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(contractor.id, "money");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });
  const year = Number(req.nextUrl.searchParams.get("year")) || undefined;
  const setAsides = await setAsideStore.list(contractor.id, year);
  return NextResponse.json({ setAsides });
}

/** Records that the owner moved money aside. Not a tax payment, not a filing. */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const contractor = await contractorStore.getByUsername(String(body.contractorUsername ?? ""));
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(contractor.id, "money");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });

  const amountCents = toCents(body.amount);
  if (amountCents <= 0) return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });

  const quarter = Number(body.quarter);
  if (![1, 2, 3, 4].includes(quarter)) {
    return NextResponse.json({ error: "Quarter must be 1, 2, 3 or 4" }, { status: 400 });
  }

  const taxYear = Number(body.taxYear);
  const nowYear = new Date().getFullYear();
  if (!Number.isInteger(taxYear) || taxYear < nowYear - 10 || taxYear > nowYear + 1) {
    return NextResponse.json({ error: "Tax year is out of range" }, { status: 400 });
  }

  const movedOn = String(body.movedOn ?? "") || todayIso();
  if (!isIsoDate(movedOn)) return NextResponse.json({ error: "Date must be YYYY-MM-DD" }, { status: 400 });

  const entry: TaxSetAside = {
    id: newId("sa"),
    contractorId: contractor.id,
    taxYear,
    quarter,
    amountCents,
    movedOn,
    note: String(body.note ?? "").slice(0, 200),
    createdAt: new Date().toISOString(),
  };

  const created = await setAsideStore.create(entry);
  return NextResponse.json({ ok: true, setAside: created });
}
