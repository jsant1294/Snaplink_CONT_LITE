import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { convertLead } from "@/lib/real-estate/phase4-repositories";
import { triggerWorkflows } from "@/lib/real-estate/phase5-repositories";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "clients:manage");
  if (!principal) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const body = await req.json();
  if (!["buyer", "seller"].includes(body.target)) return NextResponse.json({ error: "Target must be buyer or seller" }, { status: 400 });
  const record = await convertLead(principal, (await params).id, body.target, body.data || {});
  if (record) await triggerWorkflows(principal, "lead_converted", body.target, String(record.id));
  return record ? NextResponse.json({ record }, { status: 201 }) : NextResponse.json({ error: "Lead not found" }, { status: 404 });
}
