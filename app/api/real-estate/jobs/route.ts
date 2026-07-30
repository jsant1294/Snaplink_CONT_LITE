import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { listJobs } from "@/lib/real-estate/jobs";
export async function GET(req: NextRequest) { const p = await authorizeRealEstate(req, "settings:manage"); return p ? NextResponse.json({ jobs: await listJobs(p, req.nextUrl.searchParams.get("status") || undefined) }) : NextResponse.json({ error: "Access denied" }, { status: 403 }); }
