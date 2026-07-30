import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { deliverabilitySummary } from "@/lib/real-estate/integrations/deliverability";
export async function GET(req: NextRequest) { const p = await authorizeRealEstate(req, "analytics:view"); return p ? NextResponse.json(await deliverabilitySummary(p)) : NextResponse.json({ error: "Access denied" }, { status: 403 }); }
