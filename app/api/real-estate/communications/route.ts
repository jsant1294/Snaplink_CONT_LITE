import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { createCommunication, listCommunicationHistory } from "@/lib/real-estate/phase5-repositories";
import { enqueueJob } from "@/lib/real-estate/jobs";
export async function GET(req: NextRequest) {
  const p = await authorizeRealEstate(req, "clients:view"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const q = req.nextUrl.searchParams;
  return NextResponse.json(await listCommunicationHistory(p, { search: q.get("search") || undefined, status: q.get("status") || undefined, channel: q.get("channel") || undefined, page: Number(q.get("page") || 1), pageSize: Number(q.get("pageSize") || 20) }));
}
export async function POST(req: NextRequest) {
  const p = await authorizeRealEstate(req, "clients:manage"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const body = await req.json(); if (!["email", "sms"].includes(body.channel) || !body.recipient || !body.body) return NextResponse.json({ error: "Channel, recipient, and message are required" }, { status: 400 });
  const communication = await createCommunication(p, p.membershipId, body);
  if (communication.status === "queued" || communication.status === "scheduled") await enqueueJob(p, `tenant:${p.tenantId}`, p.membershipId, { jobType: "communication.send", payload: { communicationId: communication.id }, idempotencyKey: `communication.send:${communication.id}`, scheduledAt: communication.scheduledAt || undefined });
  return NextResponse.json({ communication }, { status: 201 });
}
