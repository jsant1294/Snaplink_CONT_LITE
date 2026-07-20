import { NextRequest, NextResponse } from "next/server";
import { estimateStore, leadStore, newId } from "@/lib/store";
import type { Estimate, EstimateLineItem } from "@/lib/types";
import { authorizeContractorId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("leadId") ?? "";
  const lead = await leadStore.get(leadId);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, lead.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const estimate = await estimateStore.getByLead(leadId);
  return NextResponse.json({ estimate: estimate ?? null });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const lead = await leadStore.get(String(body.leadId ?? ""));
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, lead.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const lineItems: EstimateLineItem[] = Array.isArray(body.lineItems)
    ? body.lineItems
        .map((li: Record<string, unknown>) => ({
          id: typeof li.id === "string" && li.id ? li.id : newId("li"),
          libraryId: typeof li.libraryId === "string" ? li.libraryId : undefined,
          description: String(li.description ?? "").slice(0, 200),
          descriptionEs: li.descriptionEs ? String(li.descriptionEs).slice(0, 200) : undefined,
          qty: Math.max(0, Number(li.qty) || 0),
          unit: String(li.unit ?? "each"),
          unitPrice: Math.max(0, Number(li.unitPrice) || 0),
        }))
        .filter((li: EstimateLineItem) => li.description)
    : [];

  const estimate: Estimate = {
    id: newId("est"),
    leadId: lead.id,
    contractorId: lead.contractorId,
    status: body.status === "sent" ? "sent" : "draft",
    lineItems,
    taxRate: Math.max(0, Math.min(25, Number(body.taxRate) || 0)),
    discount: Math.max(0, Number(body.discount) || 0),
    depositPercent: Math.max(0, Math.min(100, Number(body.depositPercent) || 0)),
    notes: String(body.notes ?? "").slice(0, 2000),
    validDays: Math.max(1, Math.min(365, Number(body.validDays) || 30)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = await estimateStore.upsert(estimate);
  return NextResponse.json({ ok: true, estimate: saved });
}
