import { NextRequest, NextResponse } from "next/server";
import { flipCampaignStore, flipPageStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { requireModuleEnabled } from "@/lib/entitlements";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await flipCampaignStore.get(id);
  if (!campaign) return NextResponse.json({ error: "Flipbook not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, campaign.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(campaign.contractorId, "flipbook");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });

  const body = await req.json();
  const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds.map(String) : [];
  if (orderedIds.length === 0) {
    return NextResponse.json({ error: "orderedIds is required" }, { status: 400 });
  }
  await flipPageStore.reorder(id, orderedIds);
  const pages = await flipPageStore.listByCampaign(id);
  return NextResponse.json({ ok: true, pages });
}
