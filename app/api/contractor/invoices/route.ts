import { NextRequest, NextResponse } from "next/server";
import { invoiceStore, newId } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { requireModuleEnabled } from "@/lib/entitlements";
import { toCents } from "@/lib/money";
import { stripeEnabled } from "@/lib/stripe/config";
import type { Invoice } from "@/lib/invoice-types";

export async function GET(req: NextRequest) {
  const contractorId = req.nextUrl.searchParams.get("contractorId") ?? "";
  if (!contractorId) return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  const denied = await authorizeContractorId(req, contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(contractorId, "invoices");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });
  const invoices = await invoiceStore.list(contractorId);
  return NextResponse.json({ invoices });
}

export async function POST(req: NextRequest) {
  if (!stripeEnabled()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const body = await req.json();
  const contractorId = String(body.contractorId ?? "");
  if (!contractorId) return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  const denied = await authorizeContractorId(req, contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(contractorId, "invoices");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });

  const amountCents = toCents(body.amount);
  if (amountCents <= 0) return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
  const clientEmail = String(body.clientEmail ?? "").trim();
  if (!clientEmail) return NextResponse.json({ error: "Client email is required" }, { status: 400 });

  const now = new Date().toISOString();
  const invoice: Invoice = {
    id: newId("inv"),
    contractorId,
    leadId: body.leadId ? String(body.leadId) : undefined,
    publicToken: newId("itok"),
    clientName: String(body.clientName ?? "").slice(0, 120),
    clientEmail,
    amountCents,
    status: "draft",
    description: String(body.description ?? "").slice(0, 500),
    createdAt: now,
    updatedAt: now,
  };
  const saved = await invoiceStore.create(invoice);
  return NextResponse.json({ ok: true, invoice: saved });
}
