import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { executeCampaign } from "@/lib/real-estate/phase5-repositories";
import { enqueueJob } from "@/lib/real-estate/jobs";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await authorizeRealEstate(req, "campaigns:manage"); if (!p) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const body = await req.json(), actions = ["launch", "pause", "resume", "cancel", "test"];
  if (!actions.includes(body.action)) return NextResponse.json({ error: "Invalid campaign action" }, { status: 400 });
  const campaignId = (await params).id;
  if (body.action === "launch") {
    const job = await enqueueJob(p, `tenant:${p.tenantId}`, p.membershipId, { jobType: "campaign.expand_audience", payload: { campaignId }, idempotencyKey: `campaign.expand:${campaignId}` });
    return NextResponse.json({ queued: Boolean(job), jobId: job?.id || null });
  }
  const result = await executeCampaign(p, p.membershipId, campaignId, body.action, body.testRecipient);
  return result ? NextResponse.json(result) : NextResponse.json({ error: "Campaign not found" }, { status: 404 });
}
