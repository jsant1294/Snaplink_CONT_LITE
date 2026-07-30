import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { listAttendees, registerAttendee } from "@/lib/real-estate/phase4-repositories";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authorizeRealEstate(req, "open_houses:manage");
  return principal ? NextResponse.json({ attendees: await listAttendees(principal, (await params).id) }) : NextResponse.json({ error: "Access denied" }, { status: 403 });
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json();
  if (!String(body.name || "").trim() || (!String(body.email || "").trim() && !String(body.phone || "").trim()) || body.consent !== true) return NextResponse.json({ error: "Name, contact information, and consent are required" }, { status: 400 });
  const attendee = await registerAttendee((await params).id, body);
  return attendee ? NextResponse.json({ attendee }, { status: 201 }) : NextResponse.json({ error: "Published open house not found" }, { status: 404 });
}
