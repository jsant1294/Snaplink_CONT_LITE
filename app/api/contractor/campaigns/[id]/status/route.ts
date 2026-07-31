import { NextRequest, NextResponse } from "next/server";
import { campaignStore } from "@/lib/store";
import { authorizeContractorId } from "@/lib/auth";
import { requireModuleEnabled } from "@/lib/entitlements";
import type { CampaignStatus } from "@/lib/campaign-types";

const VALID_STATUSES: CampaignStatus[] = ["draft", "scheduled", "active", "expired", "archived"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await campaignStore.get(id);
  if (!existing) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  const denied = await authorizeContractorId(req, existing.contractorId);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });
  const moduleDenied = await requireModuleEnabled(existing.contractorId, "mini_campaigns");
  if (moduleDenied) return NextResponse.json({ error: moduleDenied }, { status: 403 });

  const body = await req.json();
  const status = body.status as CampaignStatus;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await campaignStore.setStatus(id, status);
  return NextResponse.json({ ok: true, campaign: updated });
}
