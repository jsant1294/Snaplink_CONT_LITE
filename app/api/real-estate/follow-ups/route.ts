import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { listCommunications, saveCommunication } from "@/lib/real-estate/phase4-repositories";

export async function GET(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "clients:view");
  return principal ? NextResponse.json({ communications: await listCommunications(principal) }) : NextResponse.json({ error: "Access denied" }, { status: 403 });
}
export async function POST(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "clients:manage");
  if (!principal) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const body = await req.json();
  if (!["email", "sms"].includes(body.channel) || !body.recipient || !body.body || !body.entityType || !body.entityId) return NextResponse.json({ error: "Valid channel, recipient, message, and relationship are required" }, { status: 400 });
  return NextResponse.json({ communication: await saveCommunication(principal, body) }, { status: 201 });
}
