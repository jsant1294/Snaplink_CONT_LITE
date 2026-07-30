import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { createReminder, listReminders } from "@/lib/real-estate/phase4-repositories";

export async function GET(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "dashboard:view");
  return principal ? NextResponse.json({ reminders: await listReminders(principal) }) : NextResponse.json({ error: "Access denied" }, { status: 403 });
}
export async function POST(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "clients:manage");
  if (!principal) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const body = await req.json();
  if (!body.title || !body.remindAt || !body.entityType || !body.entityId) return NextResponse.json({ error: "Title, time, and relationship are required" }, { status: 400 });
  return NextResponse.json({ reminder: await createReminder(principal, body) }, { status: 201 });
}
