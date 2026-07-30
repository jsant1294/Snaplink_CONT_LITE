import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { enqueueJob } from "@/lib/real-estate/jobs";
export async function POST(req: NextRequest) { const p = await authorizeRealEstate(req, "clients:manage"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); const bucket = new Date().toISOString().slice(0,16); const job = await enqueueJob(p, `tenant:${p.tenantId}`, p.membershipId, { jobType: "reminder.process", payload: {}, idempotencyKey: `reminders:${p.tenantId}:${bucket}` }); return NextResponse.json({ queued: Boolean(job), jobId: job?.id || null }); }
