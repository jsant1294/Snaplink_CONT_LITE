import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { safeIntegrationStatus } from "@/lib/real-estate/integrations/config";
import { safeCalendarConnections } from "@/lib/real-estate/integrations/calendar";
import { listJobs } from "@/lib/real-estate/jobs";
export async function GET(req: NextRequest) { const p = await authorizeRealEstate(req, "settings:manage"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); const jobs = await listJobs(p); const counts = Object.fromEntries(["available","processing","retry_wait","failed","dead_letter"].map(status => [status, jobs.filter(job => job.status === status).length])); return NextResponse.json({ providers: safeIntegrationStatus(), calendars: await safeCalendarConnections(p, p.membershipId), jobs: counts }); }
