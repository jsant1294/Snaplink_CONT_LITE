import { NextRequest, NextResponse } from "next/server";
import { leadStore, newId } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import type { Payment, PaymentKind, PaymentVia } from "@/lib/types";

const KINDS: PaymentKind[] = ["deposit", "balance", "partial", "full"];
const VIAS: PaymentVia[] = ["Zelle", "CashApp", "Venmo", "PayPal", "Stripe", "Cash", "Check", "Other"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const lead = await leadStore.get(String(body.leadId ?? ""));
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, lead.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const amount = Number(body.amount);
  if (!(amount > 0)) return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });

  const payment: Payment = {
    id: newId("pay"),
    leadId: lead.id,
    kind: KINDS.includes(body.kind) ? body.kind : "partial",
    amount: Math.round(amount * 100) / 100,
    via: VIAS.includes(body.via) ? body.via : "Other",
    note: body.note ? String(body.note).slice(0, 200) : undefined,
    receivedAt: body.receivedAt ? String(body.receivedAt) : new Date().toISOString(),
  };

  const updated = await leadStore.recordPayment(lead.id, payment);
  return NextResponse.json({ ok: true, lead: updated });
}

export async function DELETE(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("leadId") ?? "";
  const paymentId = req.nextUrl.searchParams.get("paymentId") ?? "";
  const lead = await leadStore.get(leadId);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, lead.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const updated = await leadStore.removePayment(leadId, paymentId);
  return NextResponse.json({ ok: true, lead: updated });
}
