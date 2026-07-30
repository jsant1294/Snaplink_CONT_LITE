import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { listAttendees, registerAttendee } from "@/lib/real-estate/phase4-repositories";
import { triggerWorkflows } from "@/lib/real-estate/phase5-repositories";
import { allowRequest } from "@/lib/real-estate/integrations/rate-limit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "open_houses:manage");
  return principal ? NextResponse.json({ attendees: await listAttendees(principal, (await params).id) }) : NextResponse.json({ error: "Access denied" }, { status: 403 });
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!allowRequest(`open-house:${ip}`, 10, 60_000)) return NextResponse.json({ error: "Too many registration attempts" }, { status: 429 });
  const body = await req.json();
  if (!String(body.name || "").trim() || (!String(body.email || "").trim() && !String(body.phone || "").trim()) || body.consent !== true) return NextResponse.json({ error: "Name, contact information, and consent are required" }, { status: 400 });
  const attendee = await registerAttendee((await params).id, body);
  if (attendee) await triggerWorkflows({ tenantId: attendee.tenantId, role: "broker_owner", agentId: null }, "open_house_registered", "open_house_attendee", attendee.id);
  return attendee ? NextResponse.json({ attendee }, { status: 201 }) : NextResponse.json({ error: "Published open house not found" }, { status: 404 });
}
