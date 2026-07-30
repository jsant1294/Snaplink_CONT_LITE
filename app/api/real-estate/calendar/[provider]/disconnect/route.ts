import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { disconnectCalendar } from "@/lib/real-estate/integrations/calendar";
export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) { const p = await authorizeRealEstate(req, "settings:manage"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); const provider = (await params).provider; if (!["google","microsoft"].includes(provider)) return NextResponse.json({ error: "Provider not found" }, { status: 404 }); return NextResponse.json({ disconnected: Boolean(await disconnectCalendar(p, p.membershipId, provider as "google"|"microsoft")) }); }
