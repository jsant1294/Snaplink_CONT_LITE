import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { createCommunication, listCommunicationHistory } from "@/lib/real-estate/phase5-repositories";
export async function GET(req: NextRequest) {
  const p = await authorizeRealEstate(req, "clients:view"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const q = req.nextUrl.searchParams;
  return NextResponse.json(await listCommunicationHistory(p, { search: q.get("search") || undefined, status: q.get("status") || undefined, channel: q.get("channel") || undefined, page: Number(q.get("page") || 1), pageSize: Number(q.get("pageSize") || 20) }));
}
export async function POST(req: NextRequest) {
  const p = await authorizeRealEstate(req, "clients:manage"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const body = await req.json(); if (!["email", "sms"].includes(body.channel) || !body.recipient || !body.body) return NextResponse.json({ error: "Channel, recipient, and message are required" }, { status: 400 });
  return NextResponse.json({ communication: await createCommunication(p, p.membershipId, body) }, { status: 201 });
}
