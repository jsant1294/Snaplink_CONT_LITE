import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { triggerWorkflows } from "@/lib/real-estate/phase5-repositories";
export async function POST(req: NextRequest) { const p = await authorizeRealEstate(req, "dashboard:view"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); const body = await req.json(); return NextResponse.json({ runs: await triggerWorkflows(p, String(body.trigger), String(body.entityType), String(body.entityId)) }); }
