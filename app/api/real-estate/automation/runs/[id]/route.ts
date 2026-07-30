import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { runAction } from "@/lib/real-estate/phase5-repositories";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { const p = await authorizeRealEstate(req, "settings:manage"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); const run = await runAction(p, (await params).id, (await req.json()).action); return run ? NextResponse.json({ run }) : NextResponse.json({ error: "Run not found" }, { status: 404 }); }
