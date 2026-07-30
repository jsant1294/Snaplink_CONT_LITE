import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { nurtureAction } from "@/lib/real-estate/phase5-repositories";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { const p = await authorizeRealEstate(req, "leads:assign"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); const action = (await req.json()).action; if (!["start","pause","stop"].includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 }); const enrollment = await nurtureAction(p, (await params).id, action); return enrollment ? NextResponse.json({ enrollment }) : NextResponse.json({ error: "Enrollment not found" }, { status: 404 }); }
