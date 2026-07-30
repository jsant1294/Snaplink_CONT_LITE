import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { triggerWorkflows } from "@/lib/real-estate/phase5-repositories";
import { enqueueJob } from "@/lib/real-estate/jobs";
export async function POST(req: NextRequest) { const p = await authorizeRealEstate(req, "dashboard:view"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); const body = await req.json(), runs = await triggerWorkflows(p, String(body.trigger), String(body.entityType), String(body.entityId)); for (const run of runs) await enqueueJob(p, `tenant:${p.tenantId}`, p.membershipId, { jobType: "automation.execute_step", payload: { runId: run.id }, idempotencyKey: `automation.step:${run.id}:0` }); return NextResponse.json({ runs }); }
