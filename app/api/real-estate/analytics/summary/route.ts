import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { analyticsSummary } from "@/lib/real-estate/phase5-repositories";
export async function GET(req: NextRequest) { const p = await authorizeRealEstate(req, "analytics:view"); return p ? NextResponse.json(await analyticsSummary(p)) : NextResponse.json({ error: "Access denied" }, { status: 403 }); }
