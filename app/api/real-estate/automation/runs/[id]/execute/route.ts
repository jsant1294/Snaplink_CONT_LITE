import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { executeWorkflowRun } from "@/lib/real-estate/phase5-repositories";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { const p = await authorizeRealEstate(req, "settings:manage"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); const run = await executeWorkflowRun(p, p.membershipId, (await params).id); return run ? NextResponse.json({ run }) : NextResponse.json({ error: "Runnable workflow not found" }, { status: 404 }); }
