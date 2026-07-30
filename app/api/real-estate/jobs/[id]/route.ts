import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { jobAction } from "@/lib/real-estate/jobs";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { const p = await authorizeRealEstate(req, "settings:manage"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); const action = (await req.json()).action; if (!["retry","cancel","requeue"].includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 }); const job = await jobAction(p, (await params).id, action); return job ? NextResponse.json({ job }) : NextResponse.json({ error: "Job unavailable" }, { status: 409 }); }
