import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { processDueReminders } from "@/lib/real-estate/phase5-repositories";
export async function POST(req: NextRequest) { const p = await authorizeRealEstate(req, "clients:manage"); return p ? NextResponse.json({ processed: await processDueReminders(p) }) : NextResponse.json({ error: "Access denied" }, { status: 403 }); }
