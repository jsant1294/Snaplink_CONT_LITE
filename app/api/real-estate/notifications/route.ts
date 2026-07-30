import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { listNotifications } from "@/lib/real-estate/phase5-repositories";
export async function GET(req: NextRequest) { const p = await authorizeRealEstate(req, "dashboard:view"); return p ? NextResponse.json({ notifications: await listNotifications(p, p.membershipId, req.nextUrl.searchParams.get("filter") || undefined) }) : NextResponse.json({ error: "Access denied" }, { status: 403 }); }
