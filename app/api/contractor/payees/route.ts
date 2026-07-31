import { NextRequest, NextResponse } from "next/server";
import { payeeStore, expenseStore, taxProfileStore, contractorStore, newId } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { requireModuleEnabled } from "@/lib/entitlements";
import { PAYEE_TYPES, TIN_TYPES, type Payee, type PayeeWithTotal, type PayeeType, type TinType } from "@/lib/money-types";

/** GET ?contractor=&year= -> payees with what was paid to each that year. */
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("contractor") ?? "";
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(contractor.id, "money");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });

  const year = Number(req.nextUrl.searchParams.get("year")) || new Date().getFullYear();
  const [list, expenses, profile] = await Promise.all([
    payeeStore.list(contractor.id),
    expenseStore.list(contractor.id, { year }),
    taxProfileStore.get(contractor.id),
  ]);
  const threshold = profile?.payeeAlertThresholdCents ?? 60000;

  const withTotals: PayeeWithTotal[] = list.map((p) => {
    const paidCents = expenses
      .filter((e) => e.payeeId === p.id)
      .reduce((s, e) => s + e.amountCents, 0);
    const overThreshold = paidCents >= threshold;
    return { ...p, paidCents, overThreshold, needsW9: overThreshold && !p.w9OnFile };
  });

  return NextResponse.json({ payees: withTotals, year, thresholdCents: threshold });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contractor = await contractorStore.getByUsername(String(body.contractorUsername ?? ""));
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(contractor.id, "money");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });

  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "A name is required" }, { status: 400 });

  // SECURITY: never accept or store a full TIN. Last 4 digits only.
  const rawLast4 = String(body.tinLast4 ?? "").replace(/\D/g, "");
  if (rawLast4 && rawLast4.length > 4) {
    return NextResponse.json(
      { error: "Only the last 4 digits of the TIN can be stored. Upload the W-9 for the full number." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const payee: Payee = {
    id: newId("pye"),
    contractorId: contractor.id,
    name: name.slice(0, 140),
    payeeType: PAYEE_TYPES.includes(body.payeeType) ? (body.payeeType as PayeeType) : "individual",
    legalName: body.legalName ? String(body.legalName).slice(0, 160) : undefined,
    address: body.address ? String(body.address).slice(0, 240) : undefined,
    tinType: TIN_TYPES.includes(body.tinType) ? (body.tinType as TinType) : "unknown",
    tinLast4: rawLast4 || undefined,
    w9OnFile: Boolean(body.w9OnFile),
    w9ReceivedOn: body.w9ReceivedOn ? String(body.w9ReceivedOn) : undefined,
    email: String(body.email ?? "").slice(0, 160),
    phone: String(body.phone ?? "").slice(0, 40),
    notes: String(body.notes ?? "").slice(0, 400),
    createdAt: now,
    updatedAt: now,
  };

  const w9Doc =
    body.w9Doc && body.w9Doc.dataUrl
      ? { dataUrl: String(body.w9Doc.dataUrl), filename: String(body.w9Doc.filename ?? "w9.jpg") }
      : undefined;

  const created = await payeeStore.create(payee, w9Doc);
  return NextResponse.json({ ok: true, payee: created });
}
