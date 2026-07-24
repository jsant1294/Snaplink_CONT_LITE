import { NextRequest, NextResponse } from "next/server";
import { taxProfileStore, contractorStore, newId } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { ENTITY_TYPES, type EntityType, type TaxProfile } from "@/lib/money-types";

async function loadOrCreate(contractorId: string): Promise<TaxProfile> {
  const existing = await taxProfileStore.get(contractorId);
  if (existing) return existing;
  const now = new Date().toISOString();
  return taxProfileStore.upsert({
    id: newId("tax"),
    contractorId,
    entityType: "llc_single",
    setAsidePercent: 25,
    taxYearStartMonth: 1,
    payeeAlertThresholdCents: 60000,
    createdAt: now,
    updatedAt: now,
  });
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("contractor") ?? "";
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const profile = await loadOrCreate(contractor.id);
  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const contractor = await contractorStore.getByUsername(String(body.contractorUsername ?? ""));
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const current = await loadOrCreate(contractor.id);
  const next: TaxProfile = { ...current };

  if (body.entityType !== undefined) {
    const et = String(body.entityType) as EntityType;
    if (!ENTITY_TYPES.includes(et)) {
      return NextResponse.json({ error: "Invalid business type" }, { status: 400 });
    }
    next.entityType = et;
  }
  if (body.setAsidePercent !== undefined) {
    const pct = Number(body.setAsidePercent);
    if (!isFinite(pct) || pct < 0 || pct > 60) {
      return NextResponse.json({ error: "Set-aside percent must be between 0 and 60" }, { status: 400 });
    }
    next.setAsidePercent = Math.round(pct * 10) / 10;
  }
  if (body.businessLegalName !== undefined) {
    next.businessLegalName = String(body.businessLegalName).slice(0, 160) || undefined;
  }
  if (body.payeeAlertThresholdCents !== undefined) {
    const c = Number(body.payeeAlertThresholdCents);
    if (!Number.isInteger(c) || c < 0 || c > 100_000_00) {
      return NextResponse.json({ error: "Threshold is out of range" }, { status: 400 });
    }
    next.payeeAlertThresholdCents = c;
  }
  if (body.taxYearStartMonth !== undefined) {
    const m = Number(body.taxYearStartMonth);
    next.taxYearStartMonth = m >= 1 && m <= 12 ? Math.round(m) : 1;
  }

  const saved = await taxProfileStore.upsert(next);
  return NextResponse.json({ ok: true, profile: saved });
}
