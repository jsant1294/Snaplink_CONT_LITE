import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { notificationAction } from "@/lib/real-estate/phase5-repositories";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { const p = await authorizeRealEstate(req, "dashboard:view"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); const notification = await notificationAction(p, p.membershipId, (await params).id, (await req.json()).action); return notification ? NextResponse.json({ notification }) : NextResponse.json({ error: "Notification not found" }, { status: 404 }); }
