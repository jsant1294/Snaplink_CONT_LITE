import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { savePreference } from "@/lib/real-estate/phase5-repositories";
export async function POST(req: NextRequest) { const p = await authorizeRealEstate(req, "clients:manage"); return p ? NextResponse.json({ preference: await savePreference(p, await req.json()) }) : NextResponse.json({ error: "Access denied" }, { status: 403 }); }
