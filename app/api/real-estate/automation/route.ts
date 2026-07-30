import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { listWorkflowRuns, listWorkflows, saveWorkflow, startWorkflow } from "@/lib/real-estate/phase5-repositories";
export async function GET(req: NextRequest) { const p = await authorizeRealEstate(req, "settings:manage"); return p ? NextResponse.json({ workflows: await listWorkflows(p), runs: await listWorkflowRuns(p) }) : NextResponse.json({ error: "Access denied" }, { status: 403 }); }
export async function POST(req: NextRequest) {
  const p = await authorizeRealEstate(req, "settings:manage"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 }); const body = await req.json();
  if (body.action === "start") return NextResponse.json({ run: await startWorkflow(p, String(body.workflowId), String(body.entityType), String(body.entityId)) });
  return NextResponse.json({ workflow: await saveWorkflow(p, p.membershipId, body) }, { status: 201 });
}
