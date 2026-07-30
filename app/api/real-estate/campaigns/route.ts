import { NextRequest, NextResponse } from "next/server";
import { authorizeRealEstate } from "@/lib/real-estate/auth";
import { createCampaign, listCampaigns } from "@/lib/real-estate/phase4-repositories";

export async function GET(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "campaigns:manage");
  return principal ? NextResponse.json({ campaigns: await listCampaigns(principal) }) : NextResponse.json({ error: "Access denied" }, { status: 403 });
}
export async function POST(req: NextRequest) {
  const principal = await authorizeRealEstate(req, "campaigns:manage");
  if (!principal) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const body = await req.json();
  if (!body.name || !body.campaignType) return NextResponse.json({ error: "Name and campaign type are required" }, { status: 400 });
  return NextResponse.json({ campaign: await createCampaign(principal, body, principal.membershipId) }, { status: 201 });
}
