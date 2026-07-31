import { NextRequest, NextResponse } from "next/server";
import { form1099Store, leadStore, contractorStore, newId } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { requireModuleEnabled } from "@/lib/entitlements";
import { toCents } from "@/lib/money";
import { FORM_1099_TYPES, type Form1099Received, type Form1099Type, type Reconciliation } from "@/lib/money-types";

/**
 * GET ?contractor=&year=
 * Returns the 1099s received plus a reconciliation against income recorded in
 * the app for the same year — so a mismatch is visible before filing season.
 */
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("contractor") ?? "";
  const contractor = await contractorStore.getByUsername(username);
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(contractor.id, "money");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });

  const taxYear = Number(req.nextUrl.searchParams.get("year")) || new Date().getFullYear();
  const forms = await form1099Store.list(contractor.id, taxYear);

  // Recorded income for the same year, from existing lead payments (dollars -> cents).
  const leads = await leadStore.list(contractor.username);
  let recordedIncomeCents = 0;
  for (const lead of leads) {
    for (const p of lead.payments ?? []) {
      if (String(p.receivedAt ?? "").startsWith(`${taxYear}`)) recordedIncomeCents += toCents(p.amount);
    }
  }

  const forms1099TotalCents = forms.reduce((s, f) => s + f.amountCents, 0);
  const reconciliation: Reconciliation = {
    taxYear,
    forms1099TotalCents,
    recordedIncomeCents,
    differenceCents: recordedIncomeCents - forms1099TotalCents,
  };

  return NextResponse.json({ forms, reconciliation });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contractor = await contractorStore.getByUsername(String(body.contractorUsername ?? ""));
  if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, contractor.id);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(contractor.id, "money");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });

  const issuerName = String(body.issuerName ?? "").trim();
  if (!issuerName) return NextResponse.json({ error: "Who issued it is required" }, { status: 400 });

  const amountCents = toCents(body.amount);
  if (amountCents <= 0) return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });

  const taxYear = Number(body.taxYear);
  const nowYear = new Date().getFullYear();
  if (!Number.isInteger(taxYear) || taxYear < nowYear - 10 || taxYear > nowYear + 1) {
    return NextResponse.json({ error: "Tax year is out of range" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const form: Form1099Received = {
    id: newId("f1099"),
    contractorId: contractor.id,
    taxYear,
    issuerName: issuerName.slice(0, 160),
    formType: FORM_1099_TYPES.includes(body.formType) ? (body.formType as Form1099Type) : "1099-NEC",
    amountCents,
    notes: String(body.notes ?? "").slice(0, 400),
    createdAt: now,
    updatedAt: now,
  };

  const doc =
    body.doc && body.doc.dataUrl
      ? { dataUrl: String(body.doc.dataUrl), filename: String(body.doc.filename ?? "1099.jpg") }
      : undefined;

  const created = await form1099Store.create(form, doc);
  return NextResponse.json({ ok: true, form: created });
}
