import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { listCalendarConnections, saveCalendarConnection } from "@/lib/real-estate/phase4-repositories";

export async function GET(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "dashboard:view");
  return principal ? NextResponse.json({ connections: await listCalendarConnections(principal, principal.membershipId) }) : NextResponse.json({ error: "Access denied" }, { status: 403 });
}
export async function POST(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "dashboard:view");
  if (!principal) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const body = await req.json();
  if (!["google", "outlook", "ical"].includes(body.provider)) return NextResponse.json({ error: "Unsupported calendar provider" }, { status: 400 });
  return NextResponse.json({ connection: await saveCalendarConnection(principal, principal.membershipId, body) });
}
