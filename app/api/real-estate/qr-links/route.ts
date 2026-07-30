import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { createQrLink } from "@/lib/real-estate/phase5-repositories";
export async function POST(req: NextRequest) { const p = await authorizeRealEstate(req, "campaigns:manage"); return p ? NextResponse.json({ link: await createQrLink(p, await req.json()) }, { status: 201 }) : NextResponse.json({ error: "Access denied" }, { status: 403 }); }
