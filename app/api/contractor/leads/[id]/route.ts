import { NextRequest, NextResponse } from "next/server";
import { leadStore } from "@/lib/store";
import { LEAD_STATUSES } from "@/lib/types";
import { authorizeContractorId } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lead = await leadStore.get(id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, lead.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  return NextResponse.json({ lead });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  if (!LEAD_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const existing = await leadStore.get(id);
  if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, existing.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const lead = await leadStore.updateStatus(id, body.status);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  return NextResponse.json({ ok: true, lead });
}
