import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { reminderAction } from "@/lib/real-estate/phase5-repositories";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { const p = await authorizeRealEstate(req, "clients:manage"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); const action = (await req.json()).action; if (!["cancel","complete","retry"].includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 }); const reminder = await reminderAction(p, (await params).id, action); return reminder ? NextResponse.json({ reminder }) : NextResponse.json({ error: "Reminder not found" }, { status: 404 }); }
