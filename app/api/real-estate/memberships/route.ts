import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { listMemberships, upsertMembership } from "@/lib/real-estate/phase4-repositories";
import type { RealEstateRole } from "@/lib/real-estate/types";

export async function GET(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "settings:manage");
  return principal ? NextResponse.json({ memberships: await listMemberships(principal) }) : NextResponse.json({ error: "Access denied" }, { status: 403 });
}
export async function POST(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "settings:manage");
  if (!principal) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const body = await req.json();
  if (!body.userEmail || !body.role) return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
  return NextResponse.json({ membership: await upsertMembership(principal, { userEmail: body.userEmail, role: body.role as RealEstateRole, agentId: body.agentId, isActive: body.isActive }) });
}
