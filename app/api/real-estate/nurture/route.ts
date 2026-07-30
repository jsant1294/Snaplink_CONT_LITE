import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { enrollNurture, listNurture } from "@/lib/real-estate/phase5-repositories";
export async function GET(req: NextRequest) { const p = await authorizeRealEstate(req, "leads:view"); return p ? NextResponse.json({ enrollments: await listNurture(p) }) : NextResponse.json({ error: "Access denied" }, { status: 403 }); }
export async function POST(req: NextRequest) { const p = await authorizeRealEstate(req, "leads:assign"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); const enrollment = await enrollNurture(p, await req.json()); return enrollment ? NextResponse.json({ enrollment }, { status: 201 }) : NextResponse.json({ error: "Lead unavailable or already enrolled" }, { status: 409 }); }
